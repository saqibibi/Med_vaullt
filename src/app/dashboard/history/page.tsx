import { createClient } from '@/utils/supabase/server'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import HistoryClient from './HistoryClient'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch all documents for this user
    const { data: documents } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="w-full flex flex-col items-center pb-8 select-none">

            {/* Header Section */}
            <div className="w-full max-w-sm mt-6 mb-6 relative px-2">
                <Link href="/dashboard" className="absolute -left-2 top-0.5 p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-500">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="text-center">
                    <h1 className="text-2xl font-extrabold text-slate-900 mb-1">My Reports</h1>
                    <p className="text-slate-500 text-sm font-semibold">Your encrypted clinical records</p>
                </div>
            </div>

            {/* Document List managed by Client Component */}
            <HistoryClient documents={documents || []} />

        </div>
    )
}
