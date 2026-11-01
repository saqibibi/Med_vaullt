
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const query = String(body.query ?? '').trim()

    if (!query || query.length > 500) {
      return NextResponse.json(
        { error: 'Enter a search query of up to 500 characters.' },
        { status: 400 }
      )
    }

    // Read only the current user's documents.
    // No joins or database schema changes are needed.
    const { data: documents, error } = await supabase
      .from('vault_documents')
      .select('id, title, file_name, summary, processing_status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Chat search failed:', error)

      return NextResponse.json(
        { error: 'Could not search your documents.' },
        { status: 500 }
      )
    }

    const terms = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term: string) => term.length >= 2)

    const showAll = /\b(all|every|show|list)\b/i.test(query) &&
      /\b(reports?|documents?|records?|files?)\b/i.test(query)

    const results = (documents ?? [])
      .map((doc) => {
        const title = doc.title || doc.file_name || 'Medical document'
        const fileName = doc.file_name || ''
        const summary = doc.summary || ''

        const searchableText =
          `${title} ${fileName} ${summary}`.toLowerCase()

        const matchingKeywords = terms.filter((term: string) =>
          searchableText.includes(term)
        )

        return {
          id: doc.id,
          title,
          fileName,
          category: 'Document',
          reportDate: null,
          uploadDate: doc.created_at,
          summary: summary || null,
          matchingKeywords,
          matchingMeasurements: [],
          processingStatus: doc.processing_status || 'unknown',
          relevanceScore: matchingKeywords.length,
          openUrl: `/api/reports/${encodeURIComponent(doc.id)}/open`,
        }
      })
      .filter((doc) => showAll || doc.relevanceScore > 0)
      .slice(0, 10)

    return NextResponse.json({
      query,
      count: results.length,
      results,
    })
  } catch (error) {
    console.error('Chat search error:', error)

    return NextResponse.json(
      { error: 'An unexpected error occurred while searching.' },
      { status: 500 }
    )
  }
}
