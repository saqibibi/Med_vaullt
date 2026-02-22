'use client'

import { useState } from 'react'
import { FileText, Calendar, Image as ImageIcon, File as FileIcon, X, Download, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface DocumentItem {
    id: string
    title: string
    file_name: string
    summary: string | null
    public_url: string
    storage_path: string // Added to locate file in storage for deletion
    created_at: string
}

interface HistoryClientProps {
    documents: DocumentItem[]
}

export default function HistoryClient({ documents }: HistoryClientProps) {
    const [docs, setDocs] = useState<DocumentItem[]>(documents)
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const router = useRouter()

    // Helper to determine if the URL is an image
    const isImage = (fileName: string) => {
        return !!fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
    }

    // Attempt to force a download instead of navigating
    const handleDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
        // Prevent event propagation so we don't accidentally open the modal if clicking the outer area
        e.stopPropagation()
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error("Download failed, falling back to new tab opening.", error)
            window.open(url, '_blank')
        }
    }

    // Delete a document from Storage and DB
    const handleDelete = async (e: React.MouseEvent, doc: DocumentItem) => {
        e.stopPropagation()

        const confirmDelete = window.confirm(`Are you sure you want to delete "${doc.title || doc.file_name}"?\nThis action cannot be undone.`)
        if (!confirmDelete) return

        setIsDeleting(doc.id)

        try {
            const supabase = createClient()

            // 1. Delete file from Storage
            const { error: storageError } = await supabase.storage
                .from('vault_assets')
                .remove([doc.storage_path])

            if (storageError) throw storageError

            // 2. Delete row from Database
            const { error: dbError } = await supabase
                .from('vault_documents')
                .delete()
                .eq('id', doc.id)

            if (dbError) throw dbError

            // 3. Update UI instantly
            setDocs(prev => prev.filter(d => d.id !== doc.id))
            router.refresh()

        } catch (err: any) {
            console.error("Failed to delete document", err)
            alert("Failed to delete the report. " + (err.message || ""))
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <>
            {/* --- Document List --- */}
            <div className="w-full max-w-sm flex flex-col gap-4 px-2">
                {(!docs || docs.length === 0) ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FileIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-[#1e293b] font-bold text-lg mb-2">No Reports Yet</h3>
                        <p className="text-slate-500 text-sm mb-6">You haven't uploaded any medical documents to your vault.</p>
                        <Link href="/dashboard/upload" className="bg-[#2563eb] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                            Upload your first report
                        </Link>
                    </div>
                ) : (
                    docs.map((doc) => {
                        const imageFlag = isImage(doc.file_name)
                        const dateObj = new Date(doc.created_at)
                        const displayDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

                        return (
                            <div
                                key={doc.id}
                                className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col gap-3 hover:border-blue-200 transition-colors group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${imageFlag ? 'bg-green-50' : 'bg-red-50'}`}>
                                        {imageFlag ? <ImageIcon className="w-6 h-6 text-green-500" /> : <FileText className="w-6 h-6 text-red-500" />}
                                    </div>
                                    <div className="flex flex-col flex-1 overflow-hidden pt-0.5">
                                        <h3 className="font-bold text-[#1e293b] text-base truncate group-hover:text-[#2563eb] transition-colors">{doc.title || doc.file_name}</h3>
                                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5" title={doc.file_name}>{doc.file_name}</p>
                                    </div>
                                </div>

                                {doc.summary && (
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 font-medium border border-slate-100 mt-1">
                                        {doc.summary}
                                    </div>
                                )}

                                {/* Action Bar */}
                                <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-1">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        {displayDate}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedDoc(doc)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </button>
                                        <button
                                            onClick={(e) => handleDownload(e, doc.public_url, doc.file_name)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, doc)}
                                            disabled={isDeleting === doc.id}
                                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                                            title="Delete Report"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* --- Fullscreen Inline Viewing Modal --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">

                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50">
                        <div className="flex flex-col overflow-hidden mr-4">
                            <h3 className="text-white font-bold text-sm truncate">{selectedDoc.title || selectedDoc.file_name}</h3>
                            <p className="text-slate-400 text-xs truncate">{selectedDoc.file_name}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={(e) => handleDownload(e, selectedDoc.public_url, selectedDoc.file_name)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-red-500/80 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Viewer Content Area */}
                    <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
                        {isImage(selectedDoc.file_name) ? (
                            <img
                                src={selectedDoc.public_url}
                                alt={selectedDoc.title || 'Document'}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                        ) : (
                            <iframe
                                src={`${selectedDoc.public_url}#toolbar=0&navpanes=0`}
                                className="w-full h-full bg-white rounded-lg shadow-2xl"
                                title={selectedDoc.title || 'PDF Document'}
                            />
                        )}

                        {/* Fallback button if iframe fails on mobile browsers for non-PDFs */}
                        {!isImage(selectedDoc.file_name) && !selectedDoc.file_name.toLowerCase().endsWith('.pdf') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 px-6 text-center">
                                <FileIcon className="w-16 h-16 text-slate-500 mb-4" />
                                <h4 className="text-white font-bold mb-2">Detailed Viewer Unavailable</h4>
                                <p className="text-slate-400 text-sm mb-6">This file type (e.g. Word Document) cannot be previewed cleanly inline.</p>
                                <button
                                    onClick={(e) => handleDownload(e, selectedDoc.public_url, selectedDoc.file_name)}
                                    className="px-6 py-3 bg-[#2563eb] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
                                >
                                    <Download className="w-5 h-5" /> Download to View
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </>
    )
}
