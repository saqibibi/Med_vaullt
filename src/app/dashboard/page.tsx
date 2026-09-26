import { createClient } from '@/utils/supabase/server'
import { ChevronRight, Folder, HeartPulse, UploadCloud, User, Droplet, Phone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import QrCodeModal from './QrCodeModal'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch the user's profile to get their real name, phone, blood group, emergency contacts
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch the latest document
    const { data: latestDocs } = await supabase
        .from('vault_documents')
        .select('title, file_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

    const latestDoc = latestDocs && latestDocs.length > 0 ? latestDocs[0] : null

    // Fallback to email prefix if no full name is set yet
    const defaultName = user.email?.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'Rohan'
    const displayFirstName = profile?.full_name
        ? profile.full_name.split(' ')[0]
        : defaultName.charAt(0).toUpperCase() + defaultName.slice(1)

    const emergencyContactsCount = profile?.emergency_contacts?.length || 0

    return (
        <div className="w-full relative select-none pb-10">
            {/* Top-Right Honeycomb Watermark */}
            <div className="absolute top-0 right-0 w-36 h-36 text-blue-500/5 pointer-events-none -z-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M20,10 L40,10 L50,25 L40,40 L20,40 L10,25 Z" />
                    <path d="M50,25 L70,25 L80,40 L70,55 L50,55 L40,40 Z" />
                    <path d="M80,40 L100,40 L110,55 L100,70 L80,70 L70,55 Z" />
                    <path d="M20,40 L40,40 L50,55 L40,70 L20,70 L10,55 Z" />
                    <path d="M50,55 L70,55 L80,70 L70,85 L50,85 L40,70 Z" />
                </svg>
            </div>

            {/* Responsive Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* Column 1: Identity & Protocols */}
                <div className="flex flex-col gap-6">
                    
                    {/* Profile Summary Card */}
                    <div className="bg-gradient-to-tr from-blue-50/60 via-white to-sky-50/20 rounded-[2rem] p-8 border border-slate-100/80 shadow-sm relative overflow-hidden flex flex-col justify-between h-[220px] group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                        {/* Dot Grid Watermark top-left */}
                        <svg className="absolute top-4 left-4 w-12 h-12 text-slate-100 opacity-40 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                            <circle cx="10" cy="10" r="2" /><circle cx="30" cy="10" r="2" /><circle cx="50" cy="10" r="2" />
                            <circle cx="10" cy="30" r="2" /><circle cx="30" cy="30" r="2" /><circle cx="50" cy="30" r="2" />
                            <circle cx="10" cy="50" r="2" /><circle cx="30" cy="50" r="2" /><circle cx="50" cy="50" r="2" />
                        </svg>
                        
                        {/* Dot Grid Watermark bottom-right */}
                        <svg className="absolute bottom-4 right-4 w-12 h-12 text-slate-100 opacity-40 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                            <circle cx="50" cy="50" r="2" /><circle cx="70" cy="50" r="2" /><circle cx="90" cy="50" r="2" />
                            <circle cx="50" cy="70" r="2" /><circle cx="70" cy="70" r="2" /><circle cx="90" cy="70" r="2" />
                            <circle cx="50" cy="90" r="2" /><circle cx="70" cy="90" r="2" /><circle cx="90" cy="90" r="2" />
                        </svg>

                        <div className="flex items-center justify-between w-full relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-white border border-blue-100/50 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <Image src={profile.avatar_url} alt="Profile" fill className="object-cover rounded-full" unoptimized />
                                    ) : (
                                        <User className="w-6 h-6 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-slate-800 font-extrabold text-lg leading-tight">Hello,...</h2>
                                    <Link href="/dashboard/profile" className="text-blue-600 font-extrabold text-[10px] tracking-wider uppercase mt-1.5 hover:underline">
                                        Complete Profile
                                    </Link>
                                </div>
                            </div>
                            <Link href="/dashboard/profile" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shrink-0">
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="flex items-center justify-between w-full mt-4 relative z-10">
                            {profile?.phone_number ? (
                                <span className="text-slate-500 font-bold text-xs tracking-wider">{profile.phone_number}</span>
                            ) : (
                                <span className="text-slate-300 font-bold text-xs italic tracking-wider">No phone set</span>
                            )}
                            {profile?.blood_group && (
                                <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-red-100">
                                    <Droplet className="w-3 h-3 fill-red-500 text-red-500" /> {profile.blood_group}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Emergency Contacts Card */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100/80 shadow-sm relative overflow-hidden flex flex-col justify-between h-[220px] group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                        {/* Dot Grid Watermark bottom-left */}
                        <svg className="absolute bottom-4 left-4 w-12 h-12 text-slate-100 opacity-40 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                            <circle cx="10" cy="50" r="2" /><circle cx="30" cy="50" r="2" /><circle cx="50" cy="50" r="2" />
                            <circle cx="10" cy="70" r="2" /><circle cx="30" cy="70" r="2" /><circle cx="50" cy="70" r="2" />
                            <circle cx="10" cy="90" r="2" /><circle cx="30" cy="90" r="2" /><circle cx="50" cy="90" r="2" />
                        </svg>

                        {/* Soft orange wave watermark */}
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-gradient-to-tr from-orange-100/30 via-white/5 to-transparent blur-2xl pointer-events-none -z-0" />

                        <div className="flex items-start justify-between w-full relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100/60 flex items-center justify-center text-orange-500 shrink-0 shadow-sm">
                                    <Phone className="w-5.5 h-5.5 fill-orange-500 text-white" />
                                </div>
                                <h3 className="text-slate-800 font-extrabold text-[17px] leading-tight max-w-[120px]">
                                    Emergency Contacts
                                </h3>
                            </div>
                            <Link href="/dashboard/profile" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shrink-0">
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="flex flex-col mt-4 relative z-10">
                            <span className="text-[10px] text-orange-600 font-extrabold uppercase tracking-wider">
                                {emergencyContactsCount} PROTOCOL{emergencyContactsCount === 1 ? '' : 'S'} CONFIGURED
                            </span>
                        </div>
                    </div>

                </div>

                {/* Column 2: Documents & Intel */}
                <div className="flex flex-col gap-6">
                    
                    {/* Document Vault Card */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100/80 shadow-sm relative overflow-hidden flex flex-col justify-between h-[220px] group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                        {/* 3D Folder Illustration Watermark */}
                        <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 text-blue-500/10 pointer-events-none group-hover:scale-105 transition-transform duration-350" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 25 C15 22, 18 20, 22 20 H40 L48 30 H80 C84 30, 85 32, 85 35 V75 C85 78, 82 80, 78 80 H22 C18 80, 15 78, 15 75 Z" fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeWidth="2.5" />
                            <path d="M15 42 L85 38 V75 C85 78, 82 80, 78 80 H22 C18 80, 15 78, 15 75 Z" fill="#2563eb" fillOpacity="0.8" stroke="#1d4ed8" strokeWidth="2" />
                            <circle cx="70" cy="62" r="10" fill="#10b981" />
                            <path d="M66 62 L69 65 L75 59" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M30 20 V12 H55 V28" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
                            <path d="M40 20 V8 H65 V28" fill="white" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8" />
                        </svg>

                        <div className="relative z-10">
                            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                                <Folder className="w-4 h-4 text-blue-600" /> Document Vault
                            </h3>
                            <div className="mt-4">
                                {latestDoc ? (
                                    <>
                                        <p className="text-slate-800 text-sm font-extrabold truncate max-w-[130px]" title={latestDoc.title || latestDoc.file_name}>
                                            Latest: {latestDoc.title || latestDoc.file_name}
                                        </p>
                                        <p className="text-slate-400 text-xs mt-1 font-semibold">
                                            Uploaded {new Date(latestDoc.created_at).toLocaleDateString()}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-slate-400 text-xs italic font-semibold">No records stored</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full mt-4 relative z-10">
                            <Link href="/dashboard/history" className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:underline">
                                Review History
                            </Link>
                            <Link href="/dashboard/history" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shrink-0">
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Critical Intel Card */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100/80 shadow-sm relative overflow-hidden flex flex-col justify-between h-[220px] group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                        {/* Shield Pulse Watermark */}
                        <svg className="absolute bottom-2 right-4 w-24 h-24 text-red-50/50 pointer-events-none opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M8 12h3l1-2 2 4 1-2h3" />
                        </svg>

                        <div className="relative z-10">
                            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                <HeartPulse className="w-3.5 h-3.5 text-red-500" /> Critical Intel
                            </h3>
                            <div className="flex items-center gap-4 mt-3">
                                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
                                    <HeartPulse className="w-5.5 h-5.5 fill-red-500 text-red-500" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-slate-800 font-extrabold text-base leading-tight">Medical Alerts</h4>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Allergies & Conditions</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full mt-4 relative z-10">
                            <Link href="/dashboard/conditions" className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1">
                                Manage Alerts <ChevronRight className="w-3 h-3 text-blue-600" />
                            </Link>
                        </div>
                    </div>

                </div>

                {/* Column 3: Actions & Quick-Access */}
                <div className="flex flex-col gap-6">
                    
                    {/* Add Record Card */}
                    <Link href="/dashboard/upload" className="bg-gradient-to-br from-blue-600 to-sky-500 rounded-[2rem] p-8 shadow-lg shadow-blue-500/10 relative overflow-hidden flex flex-col items-center justify-center text-center h-[220px] group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer">
                        {/* Honeycomb Grid Watermark */}
                        <svg className="absolute bottom-0 right-0 w-24 h-24 text-white/5 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                          <path d="M20,10 L40,10 L50,25 L40,40 L20,40 L10,25 Z" />
                          <path d="M50,25 L70,25 L80,40 L70,55 L50,55 L40,40 Z" />
                          <path d="M20,40 L40,40 L50,55 L40,70 L20,70 L10,55 Z" />
                        </svg>

                        <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center bg-white/10 relative before:content-[''] before:absolute before:inset-[-6px] before:rounded-full before:border before:border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-350 shrink-0">
                            <UploadCloud className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-white font-extrabold text-lg mt-5 leading-tight">Add Record</h3>
                        <p className="text-white/80 font-bold text-[9px] tracking-widest uppercase mt-1">Ingest Documents</p>
                    </Link>

                    {/* Emergency QR Modal trigger */}
                    <QrCodeModal
                        emergencyId={profile?.emergency_id || null}
                        profileName={profile?.full_name || displayFirstName}
                    />

                </div>

            </div>

            {/* HIPAA Compliance Banner Footer */}
            <div className="w-full bg-emerald-50/40 rounded-3xl p-6 border border-emerald-100/50 flex flex-col sm:flex-row sm:items-center justify-between mt-8 relative overflow-hidden gap-4">
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-200/50 shrink-0">
                        <ShieldCheck className="w-5.5 h-5.5 fill-emerald-600 text-emerald-600" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-emerald-800 font-extrabold text-[11px] tracking-widest uppercase leading-snug">
                            HIPAA Compliant Protocol Vault
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 leading-normal">
                            Your data is encrypted and protected with enterprise-grade security.
                        </p>
                    </div>
                </div>
                
                {/* Heartbeat rate and shield watermark on the right */}
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-48 h-full text-emerald-100/30 pointer-events-none hidden sm:block" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 30 H60 L68 15 L76 50 L84 25 L92 35 L100 30 H190" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <g transform="translate(140, 10)">
                        <path d="M10 20 C10 20 25 15 35 10 C45 15 60 20 60 20 C60 20 65 45 35 60 C5 45 10 20 10 20 Z" stroke="currentColor" strokeWidth="1.2" />
                    </g>
                </svg>
            </div>
        </div>
    )
}
