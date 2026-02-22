import { createClient } from '@/utils/supabase/server'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import ConditionsClient from './ConditionsClient'

export const dynamic = 'force-dynamic'

export default async function SeriousConditionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch the user's profile to get current serious_conditions
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    const conditions = profile?.serious_conditions || []

    return (
        <div className="w-full flex flex-col items-center pb-8">
            {/* Header Section */}
            <div className="w-full max-w-sm mt-6 mb-6 relative px-2">
                <a href="/dashboard" className="absolute -left-2 top-0.5 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                    <ChevronLeft className="w-6 h-6" />
                </a>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-1">Medical Alerts</h1>
                    <p className="text-[#4f5b72] text-sm font-medium">Serious Conditions & Allergies</p>
                </div>
            </div>

            <ConditionsClient initialConditions={conditions} profileData={profile} />
        </div>
    )
}
