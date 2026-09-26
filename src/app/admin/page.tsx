import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, CheckCircle2, XCircle, FileQuestion, Users } from 'lucide-react'
import { approveDocument, rejectDocument } from './actions'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/dashboard')
    }

    // Fetch all documents
    const { data: documents } = await supabase
        .from('vault_documents')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen flex flex-col bg-background text-slate-800 select-none">
            <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="font-black text-lg text-slate-900 tracking-tight hover:text-primary transition-colors flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-extrabold text-sm">
                                M
                            </div>
                            Med Vault Admin
                        </Link>
                    </div>
                    <Link href="/dashboard" className="text-xs uppercase tracking-wider font-extrabold text-slate-500 hover:text-primary transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200/50 px-3.5 py-2 rounded-xl">
                        Exit Admin
                    </Link>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
                <div className="flex justify-between items-end mb-8 relative">
                    <div className="absolute top-[-50px] left-[-30px] w-[150px] h-[150px] bg-sky-400/5 rounded-full blur-[80px] pointer-events-none" />
                    <div className="z-10 relative">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1.5">Review Pending Assets</h1>
                        <p className="text-slate-500 text-sm font-semibold">Approve or reject uploaded medical documents across the platform.</p>
                    </div>
                </div>

                {!documents || documents.length === 0 ? (
                    <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 border border-red-100/50">
                            <FileQuestion className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Assets in System</h3>
                        <p className="text-slate-400 text-sm font-semibold max-w-sm">
                            There are currently no documents uploaded by any users.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {documents.map((doc: { id: string; file_name: string; public_url: string | null; user_id: string; status: string }) => (
                            <div key={doc.id} className="group relative bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
                                <div className="aspect-square w-full bg-slate-50 border-b border-slate-100 relative overflow-hidden flex items-center justify-center">
                                    {doc.public_url ? (
                                        <Image
                                            src={doc.public_url}
                                            alt={doc.file_name}
                                            fill
                                            className="object-cover transform transition-transform duration-500 group-hover:scale-105"
                                            unoptimized
                                        />
                                    ) : (
                                        <FileText className="w-12 h-12 text-slate-400/50 transition-transform group-hover:scale-105 duration-500" />
                                    )}

                                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-sm">
                                        {doc.status === 'pending' && <><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span className="text-amber-600">Pending</span></>}
                                        {doc.status === 'approved' && <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-emerald-600">Approved</span></>}
                                        {doc.status === 'rejected' && <><div className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-red-600">Rejected</span></>}
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col z-10 flex-1">
                                    <h3 className="font-bold text-slate-800 text-sm truncate mb-1" title={doc.file_name}>
                                        {doc.file_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-4 bg-slate-50 px-2 py-0.5 rounded-md w-max border border-slate-100">
                                        <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                        <span className="truncate max-w-[120px]">{doc.user_id.slice(0, 12)}...</span>
                                    </div>

                                    {doc.status === 'pending' && (
                                        <div className="mt-auto grid grid-cols-2 gap-2">
                                            <form action={approveDocument}>
                                                <input type="hidden" name="id" value={doc.id} />
                                                <button className="w-full flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 hover:border-transparent py-2.5 rounded-xl text-xs font-bold transition-all border border-emerald-100/50 shadow-sm shadow-emerald-50/50 cursor-pointer">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Approve
                                                </button>
                                            </form>
                                            <form action={rejectDocument}>
                                                <input type="hidden" name="id" value={doc.id} />
                                                <button className="w-full flex items-center justify-center gap-1 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 hover:border-transparent py-2.5 rounded-xl text-xs font-bold transition-all border border-red-100/50 shadow-sm shadow-red-50/50 cursor-pointer">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Reject
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {doc.status !== 'pending' && (
                                        <div className="mt-auto pt-3 border-t border-slate-100 flex justify-center">
                                            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                                Already Resolved
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
