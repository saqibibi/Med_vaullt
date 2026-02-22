'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteDocument(formData: FormData) {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const storage_path = formData.get('storage_path') as string

    if (storage_path) {
        const { error: storageError } = await supabase.storage.from('vault_assets').remove([storage_path])
        if (storageError) console.error('Storage deletion error:', storageError)
    }

    const { error: dbError } = await supabase.from('vault_documents').delete().eq('id', id)
    if (dbError) console.error('DB deletion error:', dbError)

    revalidatePath('/dashboard')
}
