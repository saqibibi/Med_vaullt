import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

async function handleSignOut(req: NextRequest) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        await supabase.auth.signOut()
    }

    revalidatePath('/', 'layout')
    return NextResponse.redirect(new URL('/login', req.url), {
        status: 302,
    })
}

export async function POST(req: NextRequest) {
    return handleSignOut(req)
}

export async function GET(req: NextRequest) {
    return handleSignOut(req)
}
