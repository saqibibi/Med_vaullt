import { createClient } from '@/utils/supabase/server'
import { CheckCircle2, Phone, ChevronRight, Folder, HeartPulse, UploadCloud, QrCode, User, Droplet } from 'lucide-react'
import Link from 'next/link'
import QrCodeModal from './QrCodeModal'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch the user's profile to get their real name and emergency contact
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

    return (
        <div className="w-full flex flex-col items-center pb-8">

            {/* Top Profile Card */}
            <div className="w-full max-w-sm mt-6 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors" title="Go to Profile">
                    <Link href="/dashboard/profile" className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border-2 border-slate-50 shadow-sm relative group">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-7 h-7 text-slate-400 group-hover:scale-110 transition-transform" />
                        )}
                    </Link>
                    <div className="flex flex-col">
                        <Link href="/dashboard/profile">
                            <h1 className="text-xl font-bold text-[#1e293b] hover:text-[#2563eb] transition-colors">Hello, {displayFirstName}</h1>
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                            {profile?.blood_group && (
                                <span className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                                    <Droplet className="w-3 h-3" /> {profile.blood_group}
                                </span>
                            )}
                            {profile?.phone_number && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {profile.phone_number}
                                </span>
                            )}
                            {!profile?.blood_group && !profile?.phone_number && (
                                <Link href="/dashboard/profile" className="text-[#2563eb] hover:underline">Complete your profile</Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Constraints */}
            <div className="w-full max-w-sm flex flex-col gap-4">

                {/* Emergency Contacts Summary Card */}
                <Link href="/dashboard/profile" className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#fff9e6] p-3 rounded-xl border border-orange-100 group-hover:scale-110 transition-transform">
                            <Phone className="w-5 h-5 text-[#c29b4e] fill-[#c29b4e]" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold text-[#1e293b] text-base group-hover:text-[#2563eb] transition-colors">Emergency Contacts</h3>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">
                                {(!profile?.emergency_contacts || profile.emergency_contacts.length === 0)
                                    ? 'No contacts added'
                                    : `${profile.emergency_contacts.length} Contact${profile.emergency_contacts.length > 1 ? 's' : ''} Saved`}
                            </p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                    </div>
                </Link>

                {/* 2-Column Grid Area */}
                <div className="grid grid-cols-2 gap-4">

                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-4">

                        {/* My Medical Reports */}
                        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-start h-[160px]">
                            <h3 className="font-semibold text-[#1e293b] mb-4 text-sm">My Medical Reports</h3>
                            <Folder className="w-14 h-14 text-[#3b82f6] fill-[#3b82f6] mb-auto" />
                            <div className="w-full mt-2">
                                <p className="font-bold text-[#1e293b] text-xs">Latest Report:</p>
                                {latestDoc ? (
                                    <p className="text-slate-500 text-xs mb-2 truncate" title={latestDoc.title || latestDoc.file_name}>
                                        {latestDoc.title || latestDoc.file_name}
                                    </p>
                                ) : (
                                    <p className="text-slate-400 text-xs mb-2 italic">No reports yet</p>
                                )}
                                <Link href="/dashboard/history" className="text-[#2563eb] text-xs font-semibold flex items-center hover:text-blue-700 transition-colors bg-transparent border-none p-0 cursor-pointer">
                                    View Reports <ChevronRight className="w-3 h-3 ml-0.5 relative top-[0.5px]" />
                                </Link>
                            </div>
                        </div>

                        {/* Upload Report Button (Card) */}
                        <Link href="/dashboard/upload" className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center justify-between text-center group cursor-pointer hover:border-blue-200 transition-colors h-[180px]">

                            {/* Fake Upload Tray Icon */}
                            <div className="relative mt-2 flex-1 flex flex-col items-center justify-center w-full">
                                <div className="bg-[#2563eb] w-12 h-12 flex justify-center items-center shadow-lg transform -translate-y-2 group-hover:-translate-y-4 transition-transform z-20" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 75% 50%, 75% 100%, 25% 100%, 25% 50%, 0% 50%)' }} />
                                <div className="relative w-20 h-8 bg-[#e2e8f0] rounded-b-xl border border-white z-10 flex flex-col justify-end items-center pb-2">
                                    <div className="w-6 h-1 bg-slate-400 rounded-full" />
                                </div>
                                <div className="w-24 h-3 bg-slate-100 absolute -bottom-1 rounded-[100%] blur-[2px]" />
                            </div>

                            <div className="w-full bg-[#2563eb] text-white py-2 rounded-lg text-sm font-semibold mb-1 hover:bg-blue-700 transition-colors shadow-sm">
                                Upload Report
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">Add New Document</p>
                        </Link>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col gap-4">

                        {/* Serious Conditions */}
                        <Link href="/dashboard/conditions" className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col h-[160px] cursor-pointer hover:border-red-200 transition-colors group">
                            <h3 className="font-semibold text-[#1e293b] mb-3 text-sm group-hover:text-red-600 transition-colors">Serious Conditions</h3>

                            <div className="flex justify-between items-start flex-1 mb-2 relative overflow-hidden">
                                <ul className="text-xs text-[#1e293b] space-y-2.5 z-10">
                                    <li className="flex items-center gap-2 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />Allergies</li>
                                    <li className="flex items-center gap-2 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />Medical Alerts</li>
                                </ul>
                                <div className="absolute right-0 top-3 w-10 h-10 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                    <div className="w-full h-2 bg-red-100/50 absolute bottom-1 rounded-[100%] blur-[2px]" />
                                    <HeartPulse className="w-10 h-10 text-[#dc2626] fill-[#dc2626] relative z-20 opacity-80" />
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-50 mb-3" />
                            <div className="text-[#2563eb] text-xs font-semibold self-start group-hover:text-blue-700 flex items-center gap-1 transition-colors">
                                Manage Alerts <ChevronRight className="w-3 h-3 ml-0.5 relative top-[0.5px]" />
                            </div>
                        </Link>

                        {/* My Emergency QR Code Modal */}
                        <QrCodeModal
                            emergencyId={profile?.emergency_id || null}
                            profileName={profile?.full_name || displayFirstName}
                        />

                    </div>
                </div>

            </div>
        </div>
    )
}
