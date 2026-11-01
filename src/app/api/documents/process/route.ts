import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { processMedicalDocument } from '@/lib/search/extractor'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { documentId } = body

        if (!documentId) {
            return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
        }

        // Fetch document ensuring it belongs strictly to authenticated user
        const { data: doc, error: docError } = await supabase
            .from('vault_documents')
            .select('*')
            .eq('id', documentId)
            .eq('user_id', user.id)
            .single()

        if (docError || !doc) {
            return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
        }

        // Mark processing status as processing
        await supabase
            .from('vault_documents')
            .update({ processing_status: 'processing', processing_error: null })
            .eq('id', doc.id)

        // Download document buffer from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('vault_assets')
            .download(doc.storage_path)

        if (downloadError || !fileData) {
            const errorMsg = downloadError?.message || 'Failed to download file from storage'
            await supabase
                .from('vault_documents')
                .update({ processing_status: 'failed', processing_error: errorMsg })
                .eq('id', doc.id)
            return NextResponse.json({ error: errorMsg }, { status: 500 })
        }

        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Determine mime type
        const mimeType = fileData.type || (doc.file_name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')

        // Process document
        const extracted = await processMedicalDocument({
            buffer,
            fileName: doc.file_name,
            mimeType,
            userTitle: doc.title,
            userSummary: doc.summary
        })

        // Idempotent upsert into vault_document_metadata
        const { error: metaError } = await supabase
            .from('vault_document_metadata')
            .upsert({
                document_id: doc.id,
                user_id: user.id,
                extracted_text: extracted.extractedText,
                summary: extracted.summary,
                category: extracted.category,
                keywords: extracted.keywords,
                report_date: extracted.reportDate,
                confidence: extracted.confidence,
                processing_status: 'completed',
                error_message: null,
                processed_at: new Date().toISOString()
            }, {
                onConflict: 'document_id'
            })

        if (metaError) {
            console.error('Metadata upsert error:', metaError)
            await supabase
                .from('vault_documents')
                .update({ processing_status: 'failed', processing_error: metaError.message })
                .eq('id', doc.id)
            return NextResponse.json({ error: metaError.message }, { status: 500 })
        }

        // Clean any existing measurements for this document on retry to prevent duplicates
        await supabase
            .from('vault_medical_measurements')
            .delete()
            .eq('document_id', doc.id)

        // Insert structured measurements if any
        if (extracted.measurements.length > 0) {
            const measurementsToInsert = extracted.measurements.map(m => ({
                document_id: doc.id,
                user_id: user.id,
                test_name: m.testName,
                normalized_test_name: m.normalizedTestName,
                value_numeric: m.valueNumeric,
                value_text: m.valueText,
                unit: m.unit,
                reference_range: m.referenceRange,
                test_date: m.testDate,
                page_number: m.pageNumber,
                source_excerpt: m.sourceExcerpt,
                confidence: m.confidence
            }))

            const { error: measError } = await supabase
                .from('vault_medical_measurements')
                .insert(measurementsToInsert)

            if (measError) {
                console.warn('Measurement insert warning:', measError)
            }
        }

        // Update vault_documents processing_status to completed
        // Also if user summary was empty, update summary with the generated one
        const updates: { processing_status: string; processing_error: null; summary?: string } = {
            processing_status: 'completed',
            processing_error: null
        }
        if (!doc.summary && extracted.summary) {
            updates.summary = extracted.summary
        }

        await supabase
            .from('vault_documents')
            .update(updates)
            .eq('id', doc.id)

        return NextResponse.json({
            success: true,
            documentId: doc.id,
            summary: extracted.summary,
            category: extracted.category,
            reportDate: extracted.reportDate,
            measurementsCount: extracted.measurements.length
        })

    } catch (err) {
        console.error('Document processing route error:', err)
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Internal Server Error'
        }, { status: 500 })
    }
}
