import { expandSynonyms, normalizeMedicalTerm, MEDICAL_SYNONYM_GROUPS } from './synonyms'

export interface ParsedSearchQuery {
    rawQuery: string
    isOpenIntent: boolean
    sortOrder: 'newest' | 'oldest' | 'relevance'
    startDate?: string // ISO date string
    category?: string
    extractedTerms: string[]
    allExpandedTerms: string[]
    ftsQuery: string
}

export function parseNaturalSearchQuery(rawQuery: string): ParsedSearchQuery {
    const q = rawQuery.trim().toLowerCase()

    // 1. Detect open / view action intent
    const isOpenIntent = /^(open|launch|display|view|fetch\s+and\s+open)\b/i.test(q) ||
        /\b(open\s+the|view\s+the|open\s+my|view\s+my)\b/i.test(q)

    // 2. Detect chronological ordering intent
    let sortOrder: 'newest' | 'oldest' | 'relevance' = 'relevance'
    if (/\b(latest|newest|recent|most\s+recent|last)\b/i.test(q)) {
        sortOrder = 'newest'
    } else if (/\b(oldest|earliest|first)\b/i.test(q)) {
        sortOrder = 'oldest'
    }

    // 3. Detect timeframe restrictions (e.g. "last 6 months", "past year")
    let startDate: string | undefined = undefined
    const now = new Date()

    const sixMonthsMatch = /\b(last|past)\s+(6|six)\s+months\b/i.test(q)
    const threeMonthsMatch = /\b(last|past)\s+(3|three)\s+months\b/i.test(q)
    const oneMonthMatch = /\b(last|past)\s+(month|1\s+month|one\s+month|30\s+days)\b/i.test(q)
    const oneYearMatch = /\b(last|past)\s+(year|1\s+year|one\s+year|12\s+months)\b/i.test(q)

    if (sixMonthsMatch) {
        const d = new Date(now)
        d.setMonth(d.getMonth() - 6)
        startDate = d.toISOString().split('T')[0]
    } else if (threeMonthsMatch) {
        const d = new Date(now)
        d.setMonth(d.getMonth() - 3)
        startDate = d.toISOString().split('T')[0]
    } else if (oneMonthMatch) {
        const d = new Date(now)
        d.setMonth(d.getMonth() - 1)
        startDate = d.toISOString().split('T')[0]
    } else if (oneYearMatch) {
        const d = new Date(now)
        d.setFullYear(d.getFullYear() - 1)
        startDate = d.toISOString().split('T')[0]
    }

    // 4. Detect medical category
    let category: string | undefined = undefined
    if (/\b(blood\s+test|blood\s+report|hematology|lab\s+test|pathology)\b/i.test(q)) {
        category = 'Blood Test'
    } else if (/\b(radiology|x-ray|xray|mri|ct\s+scan|ultrasound|sonography)\b/i.test(q)) {
        category = 'Radiology'
    } else if (/\b(prescription|rx|medication|medicines)\b/i.test(q)) {
        category = 'Prescription'
    } else if (/\b(discharge\s+summary|discharge\s+card|hospital\s+discharge)\b/i.test(q)) {
        category = 'Discharge Summary'
    }

    // 5. Extract specific medical terms & keywords
    const matchedTerms = new Set<string>()

    // Check against synonym dictionary first
    for (const group of MEDICAL_SYNONYM_GROUPS) {
        const allKeywords = [group.primary, ...group.aliases]
        for (const kw of allKeywords) {
            // Match whole word or exact phrase
            const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
            const regex = new RegExp(`\\b${escaped}\\b`, 'i')
            if (regex.test(q)) {
                matchedTerms.add(kw)
            }
        }
    }

    // Strip out common conversational stopwords
    const stripped = q
        .replace(/\b(find|show|get|search|give|open|view|display|all|my|the|reports?|documents?|records?|files?|containing|mentioning|mentions?|readings?|results?|with|from|in|for|of|and|or|latest|newest|recent|oldest|last|past|months?|years?|days?)\b/gi, ' ')
        .replace(/[^\w\s]/g, ' ')
        .trim()

    const extraTokens = stripped.split(/\s+/).filter(t => t.length >= 2)
    for (const t of extraTokens) {
        matchedTerms.add(t)
    }

    const extractedTerms = Array.from(matchedTerms)

    // Expand each extracted term using the synonyms engine
    const expandedSet = new Set<string>()
    for (const term of extractedTerms) {
        const expanded = expandSynonyms(term)
        for (const item of expanded) {
            expandedSet.add(item)
        }
    }

    // If no specific medical terms found, add any leftover tokens
    if (expandedSet.size === 0 && extraTokens.length > 0) {
        for (const t of extraTokens) {
            expandedSet.add(t)
        }
    }

    const allExpandedTerms = Array.from(expandedSet)

    // Format for Postgres Full-Text Search tsquery: 'term1' | 'term2'
    // Sanitizing tokens: only alphanumeric
    const validFtsTokens = allExpandedTerms
        .flatMap(term => term.split(/\s+/))
        .map(token => token.replace(/[^a-zA-Z0-9]/g, '').trim())
        .filter(token => token.length >= 2)

    const uniqueFtsTokens = Array.from(new Set(validFtsTokens))
    const ftsQuery = uniqueFtsTokens.length > 0
        ? uniqueFtsTokens.slice(0, 10).join(' | ')
        : ''

    return {
        rawQuery,
        isOpenIntent,
        sortOrder,
        startDate,
        category,
        extractedTerms,
        allExpandedTerms,
        ftsQuery
    }
}
