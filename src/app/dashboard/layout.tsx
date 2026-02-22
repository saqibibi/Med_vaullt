import { ReactNode } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Home, ClipboardList, User } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        // Replaced bg-background with explicit light colors to prevent dark mode override
        <div className="min-h-screen flex flex-col bg-[#f4f6fa] pb-20 text-[#1e293b]">

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-md mx-auto p-4 md:p-6 mb-safe">
                {children}
            </main>

            {/* Fixed Bottom Navigation exactly matching Mockup */}
            <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl z-50 pb-safe">
                <div className="max-w-md mx-auto flex justify-around items-center py-4 px-6">
                    <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#1e293b]">
                        <Home className="w-7 h-7 fill-[#1e293b]" />
                        <span className="text-xs font-semibold">Home</span>
                    </Link>

                    <Link href="/dashboard/history" className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#1e293b] transition-colors">
                        <ClipboardList className="w-7 h-7" />
                        <span className="text-xs font-medium">History</span>
                    </Link>

                    <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#1e293b] transition-colors">
                        <User className="w-7 h-7" />
                        <span className="text-xs font-medium">Profile</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
