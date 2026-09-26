'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signUp(data)

    if (error) {
        return { error: error.message }
    }

    // Check if Supabase requires email verification
    if (authData.user && !authData.session) {
        return { 
            success: true, 
            message: 'Check your email to verify your account. Then sign in.',
            redirectUrl: '/login?message=Check your email to verify your account. Then sign in.' 
        }
    }

    revalidatePath('/', 'layout')
    // New users definitely need to complete their profile
    return { success: true, redirectUrl: '/dashboard/profile' }
}
