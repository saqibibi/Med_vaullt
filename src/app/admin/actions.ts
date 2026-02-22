'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveDocument(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    await supabase
        .from('vault_documents')
        .update({ status: 'approved' })
        .eq('id', id)

    revalidatePath('/admin')
    revalidatePath('/dashboard')
}

export async function rejectDocument(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    await supabase
        .from('vault_documents')
        .update({ status: 'rejected' })
        .eq('id', id)

    revalidatePath('/admin')
    revalidatePath('/dashboard')
}
