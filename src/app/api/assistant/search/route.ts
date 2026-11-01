import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { parseNaturalSearchQuery } from '@/lib/search/query-parser'
import { normalizeMedicalTerm } from '@/lib/search/synonyms'

export interface SearchResultItem {
    id: string
    title: string
    fileName: string
    category: string
    reportDate: string | null
    uploadDate: string
    summary: string | null
    matchingKeywords: string[]
    matchingMeasurements: Array<{
        testName: string
        valueText: string
        valueNumeric: number | null
        unit: string | null
        referenceRange: string | null
        testDate: string | null
        sourceExcerpt: string | null
    }>
    processingStatus: string
    relevanceScore: number
    openUrl: string
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const rawQuery = (body.query || '').trim()

        if (!rawQuery) {
            return NextResponse.json({
                query: '',
                parsed: null,
                results: [],
                count: 0
            })
        }

        if (rawQuery.length > 500) {
            return NextResponse.json({ error: 'Query is too long (maximum 500 characters)' }, { status: 400 })
        }

        // 1. Parse natural language query
        const parsed = parseNaturalSearchQuery(rawQuery)

        // 2. Query user's documents from vault_documents
        let docQuery = supabase
            .from('vault_documents')
            .select(`
                id,
                title,
                file_name,
                summary,
                processing_status,
                created_at,
                vault_document_metadata (
                    category,
                    keywords,
                    summary,
                    report_date,
                    extracted_text,
                    processing_status
                ),
                vault_medical_measurements (
                    test_name,
                    normalized_test_name,
                    value_numeric,
                    value_text,
                    unit,
                    reference_range,
                    test_date,
                    source_excerpt
                )
            `)
            .eq('user_id', user.id)

        // Apply timeframe restriction if parsed
        if (parsed.startDate) {
            docQuery = docQuery.gte('created_at', parsed.startDate)
        }

        const { data: rawDocs, error: queryError } = await docQuery

        if (queryError) {
            console.error('Search query error:', queryError)
            return NextResponse.json({ error: 'Failed to search records' }, { status: 500 })
        }

        if (!rawDocs || rawDocs.length === 0) {
            return NextResponse.json({
                query: rawQuery,
                parsed,
                results: [],
                count: 0,
                autoOpenDoc: null
            })
        }

        // 3. Score and filter records based on the parsed query
        const queryLower = rawQuery.toLowerCase()
        const searchTerms = parsed.allExpandedTerms.map(t => t.toLowerCase())
        const targetCategory = parsed.category?.toLowerCase()

        const results: SearchResultItem[] = []

        for (const doc of rawDocs) {
            let score = 0
            const matchedKeywords = new Set<string>()

            // Normalize metadata (could be array or single object depending on supabase types)
            const meta = Array.isArray(doc.vault_document_metadata)
                ? doc.vault_document_metadata[0]
                : doc.vault_document_metadata

            const measurements = Array.isArray(doc.vault_medical_measurements)
                ? doc.vault_medical_measurements
                : []

            const docTitle = (doc.title || '').toLowerCase()
            const docFileName = (doc.file_name || '').toLowerCase()
            const docSummary = (meta?.summary || doc.summary || '').toLowerCase()
            const docCategory = (meta?.category || 'Medical Document')
            const docKeywords = (meta?.keywords || []).map((k: string) => k.toLowerCase())
            const docExtractedText = (meta?.extracted_text || '').toLowerCase()
            const reportDate = meta?.report_date || null
            const processingStatus = meta?.processing_status || doc.processing_status || 'pending'

            // Category match check
            if (targetCategory) {
                if (docCategory.toLowerCase().includes(targetCategory)) {
                    score += 40
                    matchedKeywords.add(docCategory)
                }
            }

            // Measurement match check
            const matchedMeasurements: SearchResultItem['matchingMeasurements'] = []
            for (const m of measurements) {
                const normName = (m.normalized_test_name || '').toLowerCase()
                const testName = (m.test_name || '').toLowerCase()

                const termMatched = searchTerms.some(term =>
                    normName === term ||
                    testName.includes(term) ||
                    term.includes(normName) ||
                    term.includes(testName)
                )

                if (termMatched) {
                    score += 60
                    matchedKeywords.add(m.test_name)
                    matchedMeasurements.push({
                        testName: m.test_name,
                        valueText: m.value_text,
                        valueNumeric: m.value_numeric,
                        unit: m.unit,
                        referenceRange: m.reference_range,
                        testDate: m.test_date,
                        sourceExcerpt: m.source_excerpt
                    })
                }
            }

            // Title & Filename match check
            for (const term of searchTerms) {
                if (docTitle.includes(term)) {
                    score += 35
                    matchedKeywords.add(term)
                }
                if (docFileName.includes(term)) {
                    score += 25
                    matchedKeywords.add(term)
                }
            }

            // Keyword tag match check
            for (const kw of docKeywords) {
                for (const term of searchTerms) {
                    if (kw === term || kw.includes(term) || term.includes(kw)) {
                        score += 20
                        matchedKeywords.add(kw)
                    }
                }
            }

            // Summary match check
            for (const term of searchTerms) {
                if (docSummary.includes(term)) {
                    score += 15
                    matchedKeywords.add(term)
                }
            }

            // Extracted text full body match check
            for (const term of searchTerms) {
                if (docExtractedText.includes(term)) {
                    score += 10
                    matchedKeywords.add(term)
                }
            }

            // General query fallback (if user typed something not recognized in medical dictionary)
            if (searchTerms.length === 0) {
                const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length >= 3)
                for (const w of queryWords) {
                    if (docTitle.includes(w) || docSummary.includes(w) || docFileName.includes(w) || docExtractedText.includes(w)) {
                        score += 10
                        matchedKeywords.add(w)
                    }
                }
            }

            // If user asked "show all reports" or category-only query
            if (score === 0 && (queryLower.includes('all') || targetCategory)) {
                if (!targetCategory || docCategory.toLowerCase().includes(targetCategory)) {
                    score = 5
                }
            }

            // Include if score > 0
            if (score > 0) {
                results.push({
                    id: doc.id,
                    title: doc.title || doc.file_name,
                    fileName: doc.file_name,
                    category: docCategory,
                    reportDate: reportDate,
                    uploadDate: doc.created_at,
                    summary: meta?.summary || doc.summary || null,
                    matchingKeywords: Array.from(matchedKeywords),
                    matchingMeasurements: matchedMeasurements,
                    processingStatus,
                    relevanceScore: score,
                    openUrl: `/api/reports/${doc.id}/open`
                })
            }
        }

        // 4. Sort results according to parsed order
        results.sort((a, b) => {
            const dateA = new Date(a.reportDate || a.uploadDate).getTime()
            const dateB = new Date(b.reportDate || b.uploadDate).getTime()

            if (parsed.sortOrder === 'newest') {
                return dateB - dateA
            }
            if (parsed.sortOrder === 'oldest') {
                return dateA - dateB
            }
            // Relevance sort
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore
            }
            // Secondary sort by newest date
            return dateB - dateA
        })

        // Check if there is a top result to open for "open the latest hemoglobin report"
        const autoOpenDoc = (parsed.isOpenIntent && results.length > 0)
            ? {
                id: results[0].id,
                title: results[0].title,
                openUrl: results[0].openUrl
            }
            : null

        return NextResponse.json({
            query: rawQuery,
            parsed,
            results: results.slice(0, 30),
            count: results.length,
            autoOpenDoc
        })

    } catch (err) {
        console.error('Search endpoint exception:', err)
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Internal Server Error'
        }, { status: 500 })
    }
}
