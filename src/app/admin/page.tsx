import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Clock, CheckCircle2, XCircle, FileQuestion, Users } from 'lucide-react'
import { approveDocument, rejectDocument } from './actions'
import Link from 'next/link'

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
        <div className="min-h-screen flex flex-col bg-background">
            <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="font-bold text-lg tracking-tight hover:text-primary transition-colors">
                            Med Vault Admin
                        </Link>
                    </div>
                    <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                        Exit Admin
                    </Link>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
                <div className="flex justify-between items-end mb-8 relative">
                    <div className="absolute top-[-50px] left-[-30px] w-[150px] h-[150px] bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="z-10 relative">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Review Pending Assets</h1>
                        <p className="text-muted-foreground">Approve or reject uploaded medical documents across the platform.</p>
                    </div>
                </div>

                {!documents || documents.length === 0 ? (
                    <div className="w-full glass rounded-2xl border border-white/5 p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <FileQuestion className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Assets in System</h3>
                        <p className="text-muted-foreground max-w-sm">
                            There are currently no documents uploaded by any users.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {documents.map((doc: any) => (
                            <div key={doc.id} className="group relative glass rounded-2xl border border-white/5 overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-white/20">
                                <div className="aspect-square w-full bg-black/40 relative overflow-hidden flex items-center justify-center">
                                    {doc.public_url ? (
                                        <img
                                            src={doc.public_url}
                                            alt={doc.file_name}
                                            className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <FileText className="w-12 h-12 text-muted-foreground/50 transition-transform group-hover:scale-110 duration-500" />
                                    )}

                                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-black/50 border border-white/10 uppercase tracking-wider shadow-lg">
                                        {doc.status === 'pending' && <><Clock className="w-3 h-3 text-yellow-400" /><span className="text-yellow-400">Pending</span></>}
                                        {doc.status === 'approved' && <><CheckCircle2 className="w-3 h-3 text-green-400" /><span className="text-green-400">Approved</span></>}
                                        {doc.status === 'rejected' && <><XCircle className="w-3 h-3 text-red-500" /><span className="text-red-500">Rejected</span></>}
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col bg-card/80 backdrop-blur-md z-10 border-t border-white/5 flex-1">
                                    <h3 className="font-medium text-foreground truncate mb-1" title={doc.file_name}>
                                        {doc.file_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-4">
                                        <Users className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{doc.user_id}</span>
                                    </div>

                                    {doc.status === 'pending' && (
                                        <div className="mt-auto grid grid-cols-2 gap-2">
                                            <form action={approveDocument}>
                                                <input type="hidden" name="id" value={doc.id} />
                                                <button className="w-full flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 py-2 rounded-lg text-sm font-medium transition-colors border border-green-500/20">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Approve
                                                </button>
                                            </form>
                                            <form action={rejectDocument}>
                                                <input type="hidden" name="id" value={doc.id} />
                                                <button className="w-full flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg text-sm font-medium transition-colors border border-red-500/20">
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {doc.status !== 'pending' && (
                                        <div className="mt-auto pt-2 border-t border-white/5 flex justify-center">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
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
