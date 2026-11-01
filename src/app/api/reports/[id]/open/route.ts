import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        if (!id) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
        }

        // 1. Fetch document and strictly enforce ownership on the server
        const { data: doc, error: docError } = await supabase
            .from('vault_documents')
            .select('id, user_id, storage_path, file_name, title, public_url')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (docError || !doc) {
            return NextResponse.json(
                { error: 'Report not found or you do not have permission to view this report.' },
                { status: 404 }
            )
        }

        // 2. Generate a secure, short-lived signed URL (valid for 5 minutes)
        // Works seamlessly whether the bucket is private or public
        const { data: signedData, error: signError } = await supabase.storage
            .from('vault_assets')
            .createSignedUrl(doc.storage_path, 300)

        const targetUrl = (!signError && signedData?.signedUrl)
            ? signedData.signedUrl
            : doc.public_url

        if (!targetUrl) {
            return NextResponse.json({ error: 'Could not generate access URL for this file.' }, { status: 500 })
        }

        // Check if caller requests JSON metadata (e.g. for modal viewing)
        const wantsJson = request.nextUrl.searchParams.get('json') === 'true' ||
            request.headers.get('accept')?.includes('application/json')

        if (wantsJson) {
            return NextResponse.json({
                id: doc.id,
                title: doc.title,
                fileName: doc.file_name,
                url: targetUrl,
                expiresInSeconds: 300
            }, {
                headers: {
                    'Cache-Control': 'no-store, private, max-age=0'
                }
            })
        }

        // Redirect directly to the authorized file
        const response = NextResponse.redirect(targetUrl, 307)
        response.headers.set('Cache-Control', 'no-store, private, max-age=0')
        return response

    } catch (err) {
        console.error('Error opening report:', err)
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Internal Server Error'
        }, { status: 500 })
    }
}
