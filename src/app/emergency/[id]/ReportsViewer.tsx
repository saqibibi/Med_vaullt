'use client'

import { useState } from 'react'
import { FileText, Image as ImageIcon, X, Loader2, Eye, Calendar } from 'lucide-react'

// This component ensures reports are "view-only" by disabling right clicks, 
// using generic iframes without toolbars for PDFs, and modal overlays.

export default function ReportsViewer({ reports }: { reports: any[] }) {
    const [selectedReport, setSelectedReport] = useState<any | null>(null)

    if (!reports || reports.length === 0) {
        return (
            <div className="p-5 text-center text-slate-500 font-medium">
                No medical reports available.
            </div>
        )
    }

    const openReport = (report: any) => {
        setSelectedReport(report)
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden'
    }

    const closeReport = () => {
        setSelectedReport(null)
        document.body.style.overflow = 'auto'
    }

    const isImage = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
    }

    return (
        <>
            <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => openReport(report)}
                        className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group active:bg-slate-100"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                {isImage(report.file_name)
                                    ? <ImageIcon className="w-5 h-5 text-indigo-500" />
                                    : <FileText className="w-5 h-5 text-indigo-500" />
                                }
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <p className="font-bold text-slate-800 text-sm truncate">{report.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-slate-500 font-medium truncate max-w-[120px]">{report.summary || report.file_name}</p>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0 shadow-sm">
                            <Eye className="w-4 h-4" />
                        </div>
                    </button>
                ))}
            </div>

            {/* View-Only Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 bg-black/50 text-white border-b border-white/10">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-lg leading-tight truncate pr-4">{selectedReport.title}</h3>
                            <p className="text-xs text-white/50 font-medium">View Only Mode - Downloads Disabled</p>
                        </div>
                        <button
                            onClick={closeReport}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95 shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Content area */}
                    <div className="flex-1 w-full h-full flex items-center justify-center relative bg-slate-900/50 p-2 md:p-8 overflow-hidden select-none">
                        {isImage(selectedReport.file_name) ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Invisible overlay to prevent drag/drop saving */}
                                <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()}></div>
                                <img
                                    src={selectedReport.public_url}
                                    alt={selectedReport.title}
                                    className="max-w-full max-h-full object-contain select-none pointer-events-none rounded-md"
                                    onContextMenu={(e) => e.preventDefault()}
                                    draggable="false"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-[60vh] bg-white rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner relative max-w-sm">
                                <FileText className="w-16 h-16 text-indigo-200 mb-4" />
                                <h4 className="font-bold text-slate-800 text-lg mb-2">PDF Document</h4>
                                <p className="text-sm text-slate-500 mb-6 font-medium">For compatibility, PDF reports open securely in a new browser tab.</p>

                                <a
                                    href={`${selectedReport.public_url}#toolbar=0`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2 w-full"
                                >
                                    <Eye className="w-5 h-5" />
                                    Open PDF Report
                                </a>

                                <button
                                    onClick={closeReport}
                                    className="mt-4 text-slate-400 hover:text-slate-600 font-medium text-sm py-2 px-4 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
