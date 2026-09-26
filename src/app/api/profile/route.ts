import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication failed. Please log in again.' }, { status: 401 })
        }

        const formData = await request.formData()

        // 2. Extract Data
        const updateData: Record<string, string | null | unknown[]> = {
            full_name: formData.get('full_name') as string,
            phone_number: formData.get('phone_number') as string,
            blood_group: formData.get('blood_group') as string,
            dob: formData.get('dob') as string || null,
            emergency_contacts: JSON.parse(formData.get('emergency_contacts') as string || '[]'),
            serious_conditions: JSON.parse(formData.get('serious_conditions') as string || 'null'),
        }

        // Clean up parsed nulls
        if (updateData.serious_conditions === null) delete updateData.serious_conditions;

        // 3. Handle Avatar File Upload
        const avatarFile = formData.get('avatar') as File | null
        if (avatarFile && avatarFile.size > 0) {
            const fileExt = avatarFile.name.split('.').pop()
            const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('vault_assets')
                .upload(fileName, avatarFile, { upsert: true })

            if (uploadError) {
                console.error('Avatar upload error:', uploadError)
                return NextResponse.json({ error: 'Failed to upload profile picture. ' + uploadError.message }, { status: 400 })
            }

            const { data: { publicUrl } } = supabase.storage
                .from('vault_assets')
                .getPublicUrl(fileName)

            updateData.avatar_url = publicUrl
        }

        // 4. Update or Insert (Upsert) the matching profile directly
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .upsert({ ...updateData, user_id: user.id }, { onConflict: 'user_id' })
            .select()

        if (updateError) {
            console.error('Update Error:', updateError.message)
            if (updateError.message.includes("serious_conditions")) {
                return NextResponse.json({ error: "System Error: The 'serious_conditions' column is missing in your Supabase Database. Please run the SQL script." }, { status: 400 })
            }
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        if (!updatedProfile || updatedProfile.length === 0) {
            console.error('Update Silently Failed: 0 rows affected. Likely an RLS Policy issue.')
            return NextResponse.json({ error: 'Save failed: Database security policy blocked the update. Please verify your Supabase database policies.' }, { status: 403 })
        }

        // 5. Explicitly Purge Next.js Cache for the Dashboard layout to clear nested routes!
        revalidatePath('/dashboard', 'layout')

        return NextResponse.json({ success: true, profile: updatedProfile[0] })

    } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e))
        console.error("API Route Exception:", err)
        return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 })
    }
}
