import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Phone, FileText, User as UserIcon, Droplets, AlertCircle, Activity, HeartPulse } from 'lucide-react'
import ReportsViewer from './ReportsViewer'

export const dynamic = 'force-dynamic'

export default async function EmergencyProfilePage({ params }: { params: { id: string } }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;
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
        if (!dob) return null;
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }

    const age = calculateAge(profile.dob)
    const conditions = profile.serious_conditions || []
    const contacts = profile.emergency_contacts || []
    // The profiles schema has `full_name`, not first/last.
    const fullName = profile.full_name?.trim() || 'Unknown Patient'

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-12 font-sans selection:bg-red-200">
            {/* Top Red Bar for immediate medical context */}
            <div className="bg-red-600 text-white text-center py-3 px-4 font-bold tracking-wide shadow-md flex items-center justify-center gap-2 relative z-10 text-sm">
                <AlertCircle className="w-5 h-5 animate-pulse" />
                EMERGENCY MEDICAL PROFILE
            </div>

            <div className="max-w-lg mx-auto p-4 space-y-6 mt-4">

                {/* Card 1: Patient Profile */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0"></div>

                    <div className="flex items-start justify-between relative z-10 w-full">
                        <div className="flex items-center gap-4">
                            {/* Profile Photo */}
                            <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 text-slate-400" />
                                )}
                            </div>

                            <div className="flex flex-col">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">{fullName}</h1>
                                <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-500 mt-1">
                                    {age !== null && <span className="bg-slate-100 px-2.5 py-1 rounded-md">{age} yrs</span>}
                                    {profile.gender && <span className="bg-slate-100 px-2.5 py-1 rounded-md capitalize">{profile.gender}</span>}
                                </div>
                            </div>
                        </div>

                        {profile.blood_group && (
                            <div className="flex flex-col items-center justify-center bg-red-100 text-red-600 rounded-xl w-16 h-16 shrink-0 shadow-sm border border-red-200">
                                <Droplets className="w-6 h-6 mb-0.5 fill-red-500" />
                                <span className="font-bold text-sm tracking-tighter">{profile.blood_group}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 2: Serious Conditions (⚠️ Priority) */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-red-500 overflow-hidden">
                    <div className="bg-red-500 text-white px-5 py-3.5 flex items-center justify-between">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <HeartPulse className="w-5 h-5" />
                            Critical Alerts
                        </h2>
                        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                            {conditions.length}
                        </span>
                    </div>

                    <div className="p-5">
                        {conditions.length > 0 ? (
                            <ul className="space-y-3">
                                {conditions.map((condition: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-4 p-3 bg-red-50/50 rounded-xl border border-red-100">
                                        <div className={`p-2 rounded-full mt-0.5 shrink-0 ${condition.severity === 'Critical' ? 'bg-red-500 text-white' : condition.severity === 'High' ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-white'}`}>
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col w-full">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-900 text-base leading-snug">{condition.name || condition.condition}</p>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${condition.severity === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                    {condition.severity || condition.type || 'Alert'}
                                                </span>
                                            </div>
                                            {condition.actionPlan && (
                                                <p className="text-sm text-slate-600 font-medium mt-1.5 bg-white p-2.5 rounded-lg border border-red-100">
                                                    <span className="font-bold text-red-600 block text-xs mb-0.5">ACTION PLAN:</span>
                                                    {condition.actionPlan}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-500 font-medium text-center py-2">No serious conditions listed.</p>
                        )}
                    </div>
                </div>

                {/* Card 3: Emergency Contacts */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
                        <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                            <Phone className="w-5 h-5 text-blue-500" />
                            Emergency Contacts
                        </h2>
                    </div>

                    <div className="p-5">
                        {contacts.length > 0 ? (
                            <div className="space-y-4">
                                {contacts.map((contact: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                                        <div>
                                            <p className="font-bold text-slate-800">{contact.name}</p>
                                            <p className="text-sm text-slate-500 font-medium">{contact.relation}</p>
                                        </div>
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-transform active:scale-95 shadow-md shadow-blue-500/20 flex items-center gap-2 text-sm"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Call
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 font-medium text-center py-2">No emergency contacts listed.</p>
                        )}
                    </div>
                </div>

                {/* Card 4: View-Only Reports */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Medical Reports
                        </h2>
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">
                            View Only
                        </span>
                    </div>

                    <div className="p-0">
                        <ReportsViewer reports={reports || []} />
                    </div>
                </div>

                <div className="text-center mt-8 text-xs text-slate-400 font-medium flex flex-col items-center gap-1">
                    <p>Information provided by MedVault user.</p>
                    <p>Generated for emergency medical access.</p>
                </div>
            </div>
        </div>
    )
}
