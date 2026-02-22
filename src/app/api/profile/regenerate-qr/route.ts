import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 })
        }

        // 2. Generate a new emergency_id using Postgres native function
        // We use the rpc call or just let postgres handle it by updating to a new gen_random_uuid(),
        // But since we can't easily call raw SQL in supabase-js without an RPC, 
        // We will generate the UUID strictly in the Javascript server context.
        const newEmergencyId = crypto.randomUUID()

        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ emergency_id: newEmergencyId })
            .eq('user_id', user.id)
            .select()
            .single()

        if (updateError) {
            console.error('QR Regeneration Error:', updateError.message)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        // 3. Purge Dashboard cache to show the new QR code instantly
        revalidatePath('/dashboard', 'layout')
        revalidatePath(`/emergency/${newEmergencyId}`) // pre-fetch

        return NextResponse.json({ success: true, emergency_id: updatedProfile.emergency_id })

    } catch (e: any) {
        console.error("API Route Exception:", e)
        return NextResponse.json({ error: e.message || "An unexpected error occurred" }, { status: 500 })
    }
}
