'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, User, LogOut, Shield } from 'lucide-react'

interface DashboardNavProps {
    userInitial?: string
}

export function DashboardNav({ userInitial = 'M' }: DashboardNavProps) {
    const pathname = usePathname()

    const navItems = [
        { href: '/dashboard', label: 'Home', icon: Home },
        { href: '/dashboard/history', label: 'History', icon: ClipboardList },
        { href: '/dashboard/profile', label: 'Profile', icon: User }
    ]

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    return (
        <>
            {/* Sidebar for Tablet / Desktop */}
            <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 p-6 z-40 select-none">
                
                {/* Brand Header */}
                <div className="flex items-center gap-3 mb-10 px-2 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                        <Shield className="w-5.5 h-5.5 fill-white text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900 tracking-tight text-[17px] leading-tight">Med Vault</span>
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wide">Your Health, Our Priority</span>
                    </div>
                </div>
                
                {/* Nav Links */}
                <nav className="flex flex-col gap-1.5 relative z-10">
                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all relative ${
                                    active 
                                        ? 'bg-blue-50/80 text-blue-600' 
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                                }`}
                            >
                                {/* Left active state line indicator */}
                                {active && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-md" />
                                )}
                                <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Medical Watermark Illustration */}
                <div className="mt-auto mb-6 relative w-full h-40 overflow-hidden pointer-events-none opacity-40">
                    <svg className="w-full h-full" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* ECG heartbeat lines */}
                        <path d="M10 110 H60 L68 95 L76 130 L84 105 L92 115 L100 110 H190" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                        <path d="M10 60 H40 L48 45 L56 80 L64 55 L72 65 L80 60 H190" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
                        
                        {/* DNA double helix */}
                        <g opacity="0.3">
                            {/* Helix strand A */}
                            <path d="M20 30 Q35 70 20 110 T20 190" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
                            {/* Helix strand B */}
                            <path d="M45 30 Q30 70 45 110 T45 190" stroke="#2563eb" strokeWidth="1.5" />
                            
                            {/* Helix connectors */}
                            <line x1="28" y1="45" x2="37" y2="45" stroke="#3b82f6" strokeWidth="1.5" />
                            <line x1="25" y1="60" x2="40" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                            <line x1="28" y1="75" x2="37" y2="75" stroke="#3b82f6" strokeWidth="1.5" />
                            <line x1="32" y1="90" x2="32" y2="90" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="28" y1="105" x2="37" y2="105" stroke="#3b82f6" strokeWidth="1.5" />
                            <line x1="25" y1="120" x2="40" y2="120" stroke="#3b82f6" strokeWidth="1.5" />
                        </g>

                        {/* Medical Shield in the bottom right */}
                        <g transform="translate(130, 80)" opacity="0.25">
                            <path d="M10 20 C10 20 25 15 35 10 C45 15 60 20 60 20 C60 20 65 45 35 60 C5 45 10 20 10 20 Z" fill="#3b82f6" />
                            <path d="M30 25 H40 V45 H30 Z" fill="white" />
                            <path d="M25 32 H45 V40 H25 Z" fill="white" />
                        </g>
                    </svg>
                </div>

                {/* Sidebar Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <Link 
                        href="/auth/signout" 
                        className="flex items-center gap-2 text-xs text-slate-400 font-bold hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </Link>

                    {/* Letter Avatar bubble */}
                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black select-none shadow-sm">
                        {userInitial}
                    </div>
                </div>
            </aside>

            {/* Bottom Tab Bar for Mobile */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-200/40 rounded-3xl z-50 py-2 px-6">
                <div className="flex justify-between items-center h-12">
                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
                                aria-current={active ? 'page' : undefined}
                            >
                                <div className={`p-1 rounded-lg transition-colors ${
                                    active ? 'text-blue-600' : 'text-slate-400'
                                }`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                                    active ? 'text-blue-600' : 'text-slate-400'
                                }`}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
