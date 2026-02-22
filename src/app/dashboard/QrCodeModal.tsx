'use client'

import { useState, useRef } from 'react'
import { QrCode, X, Download, ShieldAlert, RefreshCw, Loader2 } from 'lucide-react'
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
    const [qrUrl, setQrUrl] = useState<string>('')

    import('react').then(react => {
        react.useEffect(() => {
            const origin = window.location.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://med-vaullt.vercel.app'
            setQrUrl(`${origin}/emergency/${emergencyId}`)
        }, [emergencyId])
    })

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
                className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center h-[180px] cursor-pointer hover:border-blue-200 transition-colors group"
            >
                <h3 className="font-semibold text-[#1e293b] mb-3 text-[13px] self-start w-full group-hover:text-blue-600 transition-colors">My Emergency QR</h3>

                <div className="bg-[#f1f5f9] p-2.5 rounded-xl mb-auto w-full aspect-square flex items-center justify-center max-w-[90px] max-h-[90px] group-hover:bg-blue-50 transition-colors">
                    <QrCode className="w-full h-full text-[#1e293b] group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
                </div>

                <div className="w-full h-px bg-slate-100 mb-2 mt-3" />
                <p className="text-[11px] text-slate-500 font-medium w-full text-center">Tap to view & save</p>
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center mt-2 mb-6">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-[#1e293b]">Emergency Access</h2>
                            <p className="text-sm text-slate-500 mt-1 px-4 leading-relaxed">
                                First responders can scan this to view your critical medical alerts and emergency contacts.
                            </p>
                        </div>

                        {/* The Downloadable Area */}
                        {emergencyId ? (
                            <div className="flex flex-col items-center gap-6">
                                <div
                                    ref={qrRef}
                                    className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center"
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
                                        className="text-[11px] text-[#2563eb] font-bold hover:underline mb-2 flex items-center gap-1"
                                    >
                                        Preview Emergency Page <ShieldAlert className="w-3 h-3" />
                                    </a>
                                    <div className="text-center w-full border-t border-slate-100 pt-3 mt-1">
                                        <p className="font-bold text-[#1e293b] text-base">{profileName}</p>
                                        <p className="text-xs text-red-500 font-bold uppercase tracking-wider mt-0.5">Med Vault ICE</p>
                                    </div>
                                </div>

                                <div className="w-full flex flex-col gap-2">
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading || isRegenerating}
                                        className="w-full bg-[#2563eb] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                    >
                                        <Download className="w-5 h-5" />
                                        {isDownloading ? 'Saving Image...' : 'Download as Image'}
                                    </button>

                                    <button
                                        onClick={handleRegenerate}
                                        disabled={isRegenerating || isDownloading}
                                        className="w-full bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-[13px]"
                                    >
                                        {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        {isRegenerating ? 'Generating New Link...' : 'Regenerate QR Code'}
                                    </button>
                                </div>

                                <p className="text-[11px] text-slate-400 font-medium text-center px-4">
                                    Need to revoke access? Regenerating creates a new link and breaks old QR Codes.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="bg-orange-50 text-orange-700 p-4 rounded-xl text-sm font-medium border border-orange-100">
                                    You don't have an Emergency ID yet. Click the button below to instantly securely generate your first Scannable Medical ID.
                                </div>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={isRegenerating}
                                    className="w-full bg-[#2563eb] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-2"
                                >
                                    {isRegenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
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
