'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    if (authData.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', authData.user.id)
            .single()

        revalidatePath('/', 'layout')

        // Redirect to profile creation if they haven't set up a name yet
        if (!profile?.full_name || profile.full_name.trim() === '') {
            return { success: true, redirectUrl: '/dashboard/profile' }
        }
    }

    revalidatePath('/', 'layout')
    return { success: true, redirectUrl: '/dashboard' }
}
