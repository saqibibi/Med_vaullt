'use client'

import { useState, useRef, useEffect } from 'react'
import { QrCode, X, Download, ShieldAlert, RefreshCw, Loader2, ChevronRight } from 'lucide-react'
import QRCode from 'react-qr-code'
import html2canvas from 'html2canvas'
import { useRouter } from 'next/navigation'

interface QrModalProps {
    emergencyId: string | null
    profileName: string
}

export default function QrCodeModal({ emergencyId, profileName }: QrModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [isRegenerating, setIsRegenerating] = useState(false)
    const qrRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Ensure we capture the full domain dynamically without hydration errors
    const [qrUrl, setQrUrl] = useState<string>(`https://med-vaullt.vercel.app/emergency/${emergencyId}`)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const origin = window.location.origin || 'https://med-vaullt.vercel.app'
            setQrUrl(`${origin}/emergency/${emergencyId}`)
        }
    }, [emergencyId])

    const handleDownload = async () => {
        if (!qrRef.current) return

        try {
            setIsDownloading(true)
            const canvas = await html2canvas(qrRef.current, {
                scale: 3, // High resolution
                backgroundColor: '#ffffff',
                logging: false,
            })

            const image = canvas.toDataURL("image/png")
            const link = document.createElement('a')
            link.href = image
            link.download = `MedVault-EmergencyQR-${profileName.replace(/\s+/g, '-')}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Failed to download QR Code', error)
            alert("Failed to download QR code. Please try taking a screenshot.")
        } finally {
            setIsDownloading(false)
        }
    }

    const handleRegenerate = async () => {
        if (!confirm("Are you sure? This will permanently break any existing printed Medical QR Codes and issue a brand new secure ID.")) return;

        try {
            setIsRegenerating(true)
            const res = await fetch('/api/profile/regenerate-qr', { method: 'POST' })
            if (!res.ok) throw new Error("Failed to regenerate")
            router.refresh()
        } catch (e) {
            console.error(e)
            alert("Error regenerating QR code.")
        } finally {
            setIsRegenerating(false)
        }
    }

    return (
        <>
            {/* The Dashboard Card Trigger */}
            <div
                onClick={() => setIsOpen(true)}
                className="bg-white rounded-[2rem] p-8 border border-slate-100/85 shadow-sm flex flex-col justify-between h-[220px] cursor-pointer hover:border-primary/20 transition-all duration-300 group relative overflow-hidden hover:shadow-md"
            >
                {/* Purple QR Code Graphic Container watermark */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 rounded-3xl bg-indigo-50/50 border border-indigo-100/40 flex items-center justify-center text-indigo-600 shadow-sm shrink-0 pointer-events-none group-hover:scale-105 transition-transform duration-350">
                    <QrCode className="w-10 h-10" />
                </div>

                <div className="relative z-10">
                    <h3 className="font-extrabold text-slate-400 text-xs tracking-wider uppercase flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Emergency QR
                    </h3>
                    <div className="mt-4">
                        <h4 className="font-extrabold text-slate-800 text-lg leading-tight">Emergency QR</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">ICE Medical Scan</p>
                    </div>
                </div>

                <div className="flex items-center justify-between w-full mt-4 relative z-10">
                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:underline">Tap to view</span>
                    <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shrink-0">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center mt-2 mb-6">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-3 border border-red-100/50">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-extrabold text-[#1e293b]">Emergency Access</h2>
                            <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed font-semibold">
                                First responders can scan this to view your critical medical alerts and emergency contacts instantly.
                            </p>
                        </div>

                        {/* The Downloadable Area */}
                        {emergencyId ? (
                            <div className="flex flex-col items-center gap-6">
                                <div
                                    ref={qrRef}
                                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center"
                                >
                                    <QRCode
                                        value={qrUrl}
                                        size={180}
                                        level="H"
                                        className="mb-4"
                                    />
                                    <a
                                        href={qrUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-[#0284c7] font-bold hover:underline mb-2 flex items-center gap-1"
                                    >
                                        Preview Emergency Page <ShieldAlert className="w-3 h-3 text-red-500" />
                                    </a>
                                    <div className="text-center w-full border-t border-slate-100 pt-3 mt-1">
                                        <p className="font-extrabold text-slate-800 text-base">{profileName}</p>
                                        <p className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest mt-0.5">Med Vault ICE</p>
                                    </div>
                                </div>

                                <div className="w-full flex flex-col gap-2">
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading || isRegenerating}
                                        className="w-full bg-primary hover:bg-sky-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-600/10 disabled:opacity-50 cursor-pointer text-sm"
                                    >
                                        <Download className="w-5 h-5" />
                                        {isDownloading ? 'Saving Image...' : 'Download as Image'}
                                    </button>

                                    <button
                                        onClick={handleRegenerate}
                                        disabled={isRegenerating || isDownloading}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs cursor-pointer"
                                    >
                                        {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        {isRegenerating ? 'Generating New Link...' : 'Regenerate QR Code'}
                                    </button>
                                </div>

                                <p className="text-[10px] text-slate-400 font-bold text-center px-4 leading-normal">
                                    Need to revoke access? Regenerating creates a new link and breaks old QR Codes.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="bg-orange-50 text-orange-700 p-4 rounded-xl text-xs font-semibold border border-orange-100 leading-relaxed">
                                    You don&apos;t have an Emergency ID yet. Click the button below to instantly securely generate your first Scannable Medical ID.
                                </div>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={isRegenerating}
                                    className="w-full bg-primary hover:bg-sky-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-sky-600/10 disabled:opacity-50 mt-2 cursor-pointer text-sm"
                                >
                                    {isRegenerating ? <Loader2 className="w-5 h-5 animate-spin text-white/50" /> : <QrCode className="w-5 h-5" />}
                                    {isRegenerating ? 'Generating Secure Link...' : 'Generate My First QR Code'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
