import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AssistantClient from './AssistantClient'

export const dynamic = 'force-dynamic'

export default async function AssistantPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="w-full flex flex-col items-center select-none pb-12">
            <AssistantClient />
        </div>
    )
}
