import { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import { DashboardNav } from './DashboardNav'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single()

    const name = profile?.full_name || user.email || 'M'
    const initial = name.replace(/[^a-zA-Z]/g, '')[0]?.toUpperCase() || 'M'

    return (
        <div className="min-h-screen flex flex-col bg-[#f4f8fd] text-slate-800 md:pl-64 selection:bg-blue-100">
            {/* Ambient background glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px]" />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 mb-24 md:mb-8 overflow-y-auto">
                {children}
            </main>

            {/* Navigation Menus */}
            <DashboardNav userInitial={initial} />
        </div>
    )
}

