'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData): Promise<{ error: string } | void> {
    const supabase = await createClient()

    // 1. Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'Authentication failed. Please log in again.' }
    }

    // 2. Extract Data
    const updateData: any = {
        full_name: formData.get('full_name') as string,
        phone_number: formData.get('phone_number') as string,
        blood_group: formData.get('blood_group') as string,
        emergency_contacts: JSON.parse(formData.get('emergency_contacts') as string || '[]'),
    }

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
            return { error: 'Failed to upload profile picture.' }
        }

        const { data: { publicUrl } } = supabase.storage
            .from('vault_assets')
            .getPublicUrl(fileName)

        updateData.avatar_url = publicUrl
    }

    // 4. Update the matching profile directly
    const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)

    if (updateError) {
        console.error('Update Error:', updateError.message)
        return { error: updateError.message }
    }

    // 5. Revalidate cache
    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')

    // Redirect will be intercepted by Next.js router
    redirect('/dashboard')
}
