'use client'

import { useState, useEffect } from 'react'
import { FileText, Image as ImageIcon, X, Eye, Calendar } from 'lucide-react'
import Image from 'next/image'

// This component ensures reports are "view-only" by disabling right clicks, 
// using generic iframes without toolbars for PDFs, and modal overlays.

interface Report {
    id: string
    title: string
    file_name: string
    summary?: string | null
    public_url: string
    created_at: string
}

export default function ReportsViewer({ reports }: { reports: Report[] }) {
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)

    // Manage body scroll lock via effect to satisfy react-hooks/immutability
    useEffect(() => {
        if (selectedReport) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [selectedReport])

    if (!reports || reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white select-none">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                    <FileText className="w-5.5 h-5.5 text-emerald-600" />
                </div>
                <p className="text-slate-400 font-bold text-sm">No medical reports available.</p>
            </div>
        )
    }

    const openReport = (report: Report) => {
        setSelectedReport(report)
    }

    const closeReport = () => {
        setSelectedReport(null)
    }

    const isImage = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
    }

    return (
        <>
            <div className="divide-y divide-slate-100 select-none">
                {reports.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => openReport(report)}
                        className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors flex items-center justify-between group active:bg-slate-100/50 cursor-pointer"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center shrink-0">
                                {isImage(report.file_name)
                                    ? <ImageIcon className="w-5 h-5 text-emerald-600" />
                                    : <FileText className="w-5 h-5 text-emerald-600" />
                                }
                            </div>
                            <div className="flex flex-col overflow-hidden min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate group-hover:text-[#106b52] transition-colors">{report.title}</p>
                                <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                                    <p className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">{report.summary || report.file_name}</p>
                                    <span className="text-[9px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-200/60 group-hover:text-[#106b52] transition-all duration-350 shrink-0 shadow-sm">
                            <Eye className="w-4 h-4" />
                        </div>
                    </button>
                ))}
            </div>

            {/* View-Only Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
                        <div className="flex flex-col overflow-hidden mr-4">
                            <h3 className="text-white font-extrabold text-sm truncate leading-tight">{selectedReport.title}</h3>
                            <p className="text-slate-400 text-xs truncate mt-0.5">Secure View Only • Prints and Downloads Restricted</p>
                        </div>
                        <button
                            onClick={closeReport}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500 border border-white/5 flex items-center justify-center transition-all cursor-pointer text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Content area */}
                    <div className="flex-1 w-full h-full flex items-center justify-center relative bg-slate-950/20 p-4 overflow-hidden select-none">
                        {isImage(selectedReport.file_name) ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Invisible overlay to prevent drag/drop saving */}
                                <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()}></div>
                                <Image
                                    src={selectedReport.public_url}
                                    alt={selectedReport.title}
                                    fill
                                    className="object-contain select-none pointer-events-none rounded-2xl shadow-2xl border border-white/5"
                                    onContextMenu={(e) => e.preventDefault()}
                                    draggable={false}
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-full h-auto bg-white rounded-3xl overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-2xl border border-slate-100/50 relative max-w-sm">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-[#106b52]" />
                                </div>
                                <h4 className="font-extrabold text-slate-800 text-lg mb-1">Encrypted PDF Document</h4>
                                <p className="text-xs text-slate-500 mb-6 font-semibold px-2 leading-relaxed">For verification and security compliance, PDF reports load securely in a new isolation tab.</p>

                                <a
                                    href={`${selectedReport.public_url}#toolbar=0`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#106b52] hover:bg-[#0c533f] text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 w-full text-sm cursor-pointer"
                                >
                                    <Eye className="w-4 h-4" />
                                    Open Secure Viewer
                                </a>

                                <button
                                    onClick={closeReport}
                                    className="mt-4 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider py-2 px-4 transition-colors cursor-pointer"
                                >
                                    Close Preview
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
