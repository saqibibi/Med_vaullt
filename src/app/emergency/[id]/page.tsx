import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Phone, FileText, User as UserIcon, AlertCircle, HeartPulse, ShieldCheck, Activity } from 'lucide-react'
import ReportsViewer from './ReportsViewer'

export const dynamic = 'force-dynamic'

export default async function EmergencyProfilePage({ params }: { params: { id: string } }) {
    const resolvedParams = await params
    const { id } = resolvedParams
    const supabase = await createClient()

    // Fetch profile using the emergency_id (no auth required)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('emergency_id', id)
        .single()

    if (profileError) {
        console.error("Emergency Profile Fetch Error:", profileError)
    }

    if (!profile) {
        console.error("PROFILE NOT FOUND FOR ID:", id)
        notFound()
    }

    // Fetch user's medical documents/reports
    const { data: reports } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })

    const calculateAge = (dob: string) => {
        if (!dob) return null
        const diff = Date.now() - new Date(dob).getTime()
        return Math.abs(new Date(diff).getUTCFullYear() - 1970)
    }

    const age = calculateAge(profile.dob)
    const conditions = profile.serious_conditions || []
    const contacts = profile.emergency_contacts || []
    const fullName = profile.full_name?.trim() || 'Unknown Patient'

    return (
        <div className="min-h-screen bg-[#f4fbf9] text-slate-800 pb-16 font-sans selection:bg-emerald-100 relative">
            
            {/* Ambient background glows & waves */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 opacity-40">
                <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-[120px]" />
                <div className="absolute bottom-0 right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
                
                {/* ECG waves drawing on left and right */}
                <svg className="absolute left-6 top-1/4 w-32 h-64 text-emerald-600/5" viewBox="0 0 100 200" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M 0 50 H 30 L 40 10 L 50 90 L 60 40 L 70 60 H 100" />
                     <path d="M 0 150 H 30 L 40 110 L 50 190 L 60 140 L 70 160 H 100" />
                </svg>
                <svg className="absolute right-6 bottom-1/4 w-32 h-64 text-emerald-600/5" viewBox="0 0 100 200" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M 0 100 H 30 L 40 60 L 50 140 L 60 90 L 70 110 H 100" />
                </svg>
            </div>

            {/* Top dark-green header rail */}
            <div className="bg-[#106b52] text-white text-center py-4.5 px-4 font-black tracking-widest shadow-md flex items-center justify-center gap-2 relative z-10 text-xs select-none uppercase">
                <ShieldCheck className="w-5 h-5 fill-white text-[#106b52]" />
                EMERGENCY PROFILE
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6 mt-6">

                {/* Card 1: Patient Profile Summary */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5 relative z-10 min-w-0">
                        {/* Concentric dotted avatar ring */}
                        <div className="relative flex items-center justify-center shrink-0">
                            <div className="absolute inset-[-6px] rounded-full border border-dashed border-emerald-500/20 animate-[spin_40s_linear_infinite]" />
                            <div className="w-18 h-18 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-7 h-7 text-emerald-600" />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1.5 truncate">{fullName}</h1>
                            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 mt-1">
                                {age !== null && (
                                    <span className="bg-emerald-50/50 text-[#106b52] border border-emerald-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider font-extrabold">
                                        {age} Years Old
                                    </span>
                                )}
                                {profile.gender && (
                                    <span className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                        {profile.gender}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ECG heartbeat shape in a heart vector */}
                    <div className="relative z-10 shrink-0 select-none">
                        <svg className="w-20 h-20 text-emerald-500/10 shrink-0 pointer-events-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 35 C12 22, 25 15, 50 35 C75 15, 88 22, 88 35 C88 58, 50 85, 50 85 C50 85, 12 58, 12 35 Z" fill="currentColor" />
                            <path d="M25 45 H45 L48 35 L52 55 L55 42 L58 48 H75" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Card 2: Serious Conditions (Critical Alerts) */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-[#106b52] text-white px-6 py-4 flex items-center justify-between">
                        <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-2">
                            <HeartPulse className="w-4.5 h-4.5 animate-pulse text-white" />
                            Critical Alerts
                        </h2>
                        <span className="bg-white/20 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
                            {conditions.length} Active
                        </span>
                    </div>

                    <div className="p-6">
                        {conditions.length > 0 ? (
                            <ul className="space-y-4">
                                {conditions.map((condition: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${condition.severity === 'Critical' ? 'bg-red-500' : condition.severity === 'High' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                                        
                                        <div className="flex flex-col w-full pl-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-bold text-slate-800 text-sm leading-snug truncate">{condition.name || condition.condition}</p>
                                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border shrink-0 ${condition.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                    {condition.severity || 'Alert'}
                                                </span>
                                            </div>
                                            {condition.actionPlan && (
                                                <div className="mt-2.5 border-t border-slate-200/50 pt-2.5">
                                                    <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5">Emergency Action Plan</p>
                                                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/40 leading-relaxed font-semibold">
                                                        {condition.actionPlan}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                                    <FileText className="w-5.5 h-5.5 text-emerald-600" />
                                </div>
                                <p className="text-slate-400 font-bold text-sm">No serious conditions listed.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 3: Emergency Contacts */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-100">
                        <h2 className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Phone className="w-4.5 h-4.5 text-[#106b52]" />
                            Emergency Contacts
                        </h2>
                    </div>

                    <div className="p-6">
                        {contacts.length > 0 ? (
                            <div className="space-y-4">
                                {contacts.map((contact: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                                        <div className="min-w-0 mr-4">
                                            <p className="font-bold text-slate-800 truncate">{contact.name}</p>
                                            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-1">{contact.relation}</p>
                                        </div>
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="bg-[#106b52] hover:bg-[#0c533f] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-700/10 flex items-center gap-1.5 text-xs shrink-0 cursor-pointer"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            Call
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 font-bold text-center py-4 text-sm">No emergency contacts listed.</p>
                        )}
                    </div>
                </div>

                {/* Card 4: Clinical Documentation */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <FileText className="w-4.5 h-4.5 text-[#106b52]" />
                            Clinical Documentation
                        </h2>
                        <span className="bg-emerald-50 text-[#106b52] text-[10px] px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider border border-emerald-100/60">
                            View Only
                        </span>
                    </div>

                    <div className="p-0">
                        <ReportsViewer reports={reports || []} />
                    </div>
                </div>

                {/* Verification Badge Footer */}
                <div className="text-center mt-12 flex flex-col items-center gap-2 z-10 relative select-none">
                    <div className="flex items-center gap-2 justify-center w-full max-w-sm mb-1">
                        <div className="h-[1px] bg-emerald-100/80 flex-1" />
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <div className="h-[1px] bg-emerald-100/80 flex-1" />
                    </div>
                    <p className="text-[10px] text-emerald-800 font-black uppercase tracking-[0.15em]">Verified Clinical Record Vault</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Generated securely for emergency access</p>
                </div>

            </div>
        </div>
    )
}
