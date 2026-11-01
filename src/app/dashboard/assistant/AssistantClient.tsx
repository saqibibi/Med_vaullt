'use client'

import { useState, useRef } from 'react'
import {
    Search,
    Sparkles,
    FileText,
    Calendar,
    Image as ImageIcon,
    Download,
    Eye,
    X,
    Loader2,
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    Tag,
    ChevronRight,
    ExternalLink,
    RefreshCw
} from 'lucide-react'
import Image from 'next/image'

interface MatchingMeasurement {
    testName: string
    valueText: string
    valueNumeric: number | null
    unit: string | null
    referenceRange: string | null
    testDate: string | null
    sourceExcerpt: string | null
}

interface SearchResultItem {
    id: string
    title: string
    fileName: string
    category: string
    reportDate: string | null
    uploadDate: string
    summary: string | null
    matchingKeywords: string[]
    matchingMeasurements: MatchingMeasurement[]
    processingStatus: string
    relevanceScore: number
    openUrl: string
}

interface SearchApiResponse {
    query: string
    results: SearchResultItem[]
    count: number
    autoOpenDoc?: {
        id: string
        title: string
        openUrl: string
    } | null
    error?: string
}

const QUICK_PROMPTS = [
    'Latest hemoglobin report',
    'All blood test reports',
    'Blood pressure records',
    'Reports containing glucose',
    'CBC reports',
    'Lipid & cholesterol'
]

export default function AssistantClient() {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [lastQuery, setLastQuery] = useState('')
    const [results, setResults] = useState<SearchResultItem[]>([])
    const [autoOpenDoc, setAutoOpenDoc] = useState<{ id: string; title: string; openUrl: string } | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Modal preview state
    const [selectedDoc, setSelectedDoc] = useState<{
        id: string
        title: string
        fileName: string
        url: string
    } | null>(null)
    const [isOpeningDoc, setIsOpeningDoc] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)

    const handleSearch = async (searchQuery: string) => {
        const q = searchQuery.trim()
        if (!q) return

        setIsLoading(true)
        setErrorMessage(null)
        setAutoOpenDoc(null)

        try {
            const res = await fetch('/api/assistant/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q })
            })

            const data: SearchApiResponse = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to complete search')
            }

            setResults(data.results || [])
            setHasSearched(true)
            setLastQuery(q)

            if (data.autoOpenDoc) {
                setAutoOpenDoc(data.autoOpenDoc)
                // Automatically open the report modal for "open ..." query
                handleOpenReport(data.autoOpenDoc.id, data.autoOpenDoc.title)
            }

        } catch (err) {
            console.error('Search error:', err)
            setErrorMessage(err instanceof Error ? err.message : 'An error occurred while searching.')
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleSearch(query)
    }

    const onSelectPrompt = (prompt: string) => {
        setQuery(prompt)
        handleSearch(prompt)
    }

    // Securely open report through authenticated endpoint
    const handleOpenReport = async (docId: string, docTitle?: string) => {
        setIsOpeningDoc(docId)
        try {
            // Request JSON URL metadata from authorized server route
            const res = await fetch(`/api/reports/${docId}/open?json=true`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Unable to open report')
            }

            setSelectedDoc({
                id: docId,
                title: data.title || docTitle || 'Medical Document',
                fileName: data.fileName || 'document',
                url: data.url
            })
        } catch (err) {
            console.error('Failed to open report:', err)
            // Fallback: direct window open to the server authorized redirect route
            window.open(`/api/reports/${docId}/open`, '_blank')
        } finally {
            setIsOpeningDoc(null)
        }
    }

    const handleDownload = async (docId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/reports/${docId}/open?json=true`)
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error('Could not obtain download link')

            const fileRes = await fetch(data.url)
            const blob = await fileRes.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(blobUrl)
        } catch (err) {
            console.error('Download error:', err)
            window.open(`/api/reports/${docId}/open`, '_blank')
        }
    }

    const isImage = (fileName: string) => {
        return !!fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 px-2">

            {/* Header Section */}
            <div className="flex flex-col items-center text-center mt-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-sm">
                    <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    Search Your Medical Records
                </h1>
                <p className="text-slate-500 text-sm font-semibold max-w-lg leading-relaxed">
                    Ask natural questions in plain English to find test results, blood pressure, lab values, or specific reports.
                </p>
            </div>

            {/* Search Input Box */}
            <form onSubmit={onSubmit} className="w-full relative">
                <div className="relative flex items-center">
                    <div className="absolute left-5 pointer-events-none text-slate-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for hemoglobin, BP readings, blood tests, or a specific report…"
                        className="w-full pl-13 pr-32 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        {query && (
                            <button
                                type="button"
                                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Searching</span>
                                </>
                            ) : (
                                <>
                                    <span>Search</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick Query Suggestion Pills */}
                <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Suggestions:</span>
                    {QUICK_PROMPTS.map((prompt) => (
                        <button
                            key={prompt}
                            type="button"
                            onClick={() => onSelectPrompt(prompt)}
                            className="bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </form>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center justify-between text-sm font-semibold">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                        <p>{errorMessage}</p>
                    </div>
                    <button
                        onClick={() => handleSearch(query)}
                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 hover:underline cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                </div>
            )}

            {/* Auto-Open Banner */}
            {autoOpenDoc && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                            <Eye className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Identified Target Document</p>
                            <p className="text-sm font-extrabold text-slate-900">{autoOpenDoc.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenReport(autoOpenDoc.id, autoOpenDoc.title)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                        <span>Open Document</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Results Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-slate-500 font-bold text-sm">Searching your clinical vault...</p>
                </div>
            ) : hasSearched && results.length === 0 ? (
                /* Honest Empty State */
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">No Matching Reports Found</h3>
                    <p className="text-slate-500 text-sm font-semibold max-w-sm mb-6 leading-relaxed">
                        We searched your uploaded documents and extracted medical records for &ldquo;{lastQuery}&rdquo;, but found no exact or synonymous matches.
                    </p>
                    <div className="flex flex-col gap-2 max-w-xs text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600">
                        <span className="font-bold text-slate-800">Search suggestions:</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-500 font-semibold">
                            <li>Check for typos or broader terms (e.g. &ldquo;blood test&rdquo;)</li>
                            <li>Upload new medical reports from the Add Record screen</li>
                            <li>Verify that your documents have completed processing</li>
                        </ul>
                    </div>
                </div>
            ) : results.length > 0 ? (
                /* Results List */
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                            Found {results.length} Matching Document{results.length === 1 ? '' : 's'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                            Query: &ldquo;{lastQuery}&rdquo;
                        </span>
                    </div>

                    {results.map((doc) => {
                        const imageFlag = isImage(doc.fileName)
                        const formattedUploadDate = new Date(doc.uploadDate).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })
                        const formattedReportDate = doc.reportDate
                            ? new Date(doc.reportDate).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })
                            : null

                        return (
                            <div
                                key={doc.id}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-all flex flex-col gap-4 group"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${imageFlag ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                                            {imageFlag ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                                                    {doc.title}
                                                </h3>
                                                <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                                                    {doc.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-semibold truncate mt-0.5" title={doc.fileName}>
                                                {doc.fileName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleOpenReport(doc.id, doc.title)}
                                            disabled={isOpeningDoc === doc.id}
                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
                                        >
                                            {isOpeningDoc === doc.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Eye className="w-3.5 h-3.5" />
                                            )}
                                            <span>Open Report</span>
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc.id, doc.fileName)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                                            title="Download original file"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Structured Measurements (if extracted from this document) */}
                                {doc.matchingMeasurements && doc.matchingMeasurements.length > 0 && (
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                                            <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Validated Clinical Readings</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                            {doc.matchingMeasurements.map((m, idx) => (
                                                <div key={idx} className="bg-white rounded-xl p-2.5 border border-emerald-100/60 shadow-2xs flex flex-col">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-700">{m.testName}</span>
                                                        <span className="text-xs font-extrabold text-emerald-700">
                                                            {m.valueText} {m.unit || ''}
                                                        </span>
                                                    </div>
                                                    {m.referenceRange && (
                                                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                            Ref: {m.referenceRange}
                                                        </span>
                                                    )}
                                                    {m.sourceExcerpt && (
                                                        <span className="text-[10px] text-slate-400 italic truncate mt-1 border-t border-slate-50 pt-1">
                                                            &ldquo;{m.sourceExcerpt}&rdquo;
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Summary */}
                                {doc.summary && (
                                    <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100 font-semibold leading-relaxed">
                                        {doc.summary}
                                    </p>
                                )}

                                {/* Matching Keywords & Date Footer */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {doc.matchingKeywords.map((kw, idx) => (
                                            <span
                                                key={idx}
                                                className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                                            >
                                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                                {kw}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 flex-wrap">
                                        {formattedReportDate ? (
                                            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
                                                <Calendar className="w-3 h-3 text-blue-600" />
                                                Report Date: {formattedReportDate}
                                            </span>
                                        ) : null}
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            Uploaded: {formattedUploadDate}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : null}

            {/* Medical Disclaimer Banner */}
            <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-center text-[11px] text-slate-400 font-semibold mt-4">
                Clinical Note: Search summaries and measurements are automatically indexed from uploaded records. The original report remains the definitive clinical source of truth.
            </div>

            {/* --- Fullscreen Inline Report Preview Modal --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
                        <div className="flex flex-col overflow-hidden mr-4">
                            <h3 className="text-white font-extrabold text-sm truncate">{selectedDoc.title}</h3>
                            <p className="text-slate-400 text-xs truncate mt-0.5">{selectedDoc.fileName} • Authorized Vault Access</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => handleDownload(selectedDoc.id, selectedDoc.fileName)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/5 transition cursor-pointer"
                                title="Download Document"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-red-500 hover:text-white border border-white/5 transition cursor-pointer"
                                title="Close Preview"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Viewer Content Area */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
                        {isImage(selectedDoc.fileName) ? (
                            <Image
                                src={selectedDoc.url}
                                alt={selectedDoc.title}
                                fill
                                className="object-contain rounded-2xl shadow-2xl border border-white/5 bg-slate-950/20"
                                unoptimized
                            />
                        ) : (
                            <iframe
                                src={`${selectedDoc.url}#toolbar=0&navpanes=0`}
                                className="w-full h-full bg-white rounded-2xl shadow-2xl border border-white/5"
                                title={selectedDoc.title}
                            />
                        )}
                    </div>
                </div>
            )}

        </div>
    )
}
