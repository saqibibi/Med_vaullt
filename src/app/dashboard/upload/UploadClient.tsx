'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { UploadCloud, File as FileIcon, X, CheckCircle2, Loader2, Image as ImageIcon, Camera, ImagePlus, FileText, Calendar, FileType2 } from 'lucide-react'

export default function UploadClient() {
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState("")
    const [summary, setSummary] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Refs for hidden inputs
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const docInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()
    const supabase = createClient()

    // Auto-fetch current date for display purposes
    const currentDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = e.target.files[0]
            if (selected.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5MB")
                return
            }
            setFile(selected)
            setError(null)
            setSuccess(false)

            // Auto-fill title with filename without extension as a default
            const rawName = selected.name.split('.')[0] || "New Document"
            setTitle(rawName.charAt(0).toUpperCase() + rawName.slice(1))
        }
    }

    const clearFile = () => {
        setFile(null)
        setTitle("")
        setSummary("")
        setError(null)
    }

    const handleUpload = async () => {
        if (!file || !title.trim()) {
            setError("Title is required")
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated. Please log in again.")

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
            const storagePath = `${user.id}/${fileName}`

            // 1. Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('vault_assets')
                .upload(storagePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('vault_assets')
                .getPublicUrl(storagePath)

            // 2. Save metadata to vault_documents table
            const { error: dbError } = await supabase
                .from('vault_documents')
                .insert({
                    user_id: user.id,
                    storage_path: storagePath,
                    public_url: publicUrl,
                    file_name: file.name,
                    title: title.trim(),
                    summary: summary.trim(),
                    status: 'pending'
                })

            if (dbError) {
                // If DB insert fails, clean up the orphaned file in storage
                await supabase.storage.from('vault_assets').remove([storagePath])
                throw dbError
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 2000)

        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to upload file")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="w-full flex justify-center pb-8">
            <div className="w-full max-w-sm flex flex-col gap-6">

                {success && (
                    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col justify-center items-center">
                        <CheckCircle2 className="w-20 h-20 text-[#4ade80] mb-4 animate-bounce" />
                        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Upload Complete!</h2>
                        <p className="text-slate-500 font-medium">Redirecting to dashboard...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm border border-red-100 font-medium z-10 relative">
                        <X className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* State 1: File Selection */}
                {!file ? (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Hidden Native Inputs */}
                        <input
                            type="file"
                            className="hidden"
                            ref={cameraInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            capture="environment" /* Native trigger for mobile camera */
                        />
                        <input
                            type="file"
                            className="hidden"
                            ref={imageInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                        <input
                            type="file"
                            className="hidden"
                            ref={pdfInputRef}
                            onChange={handleFileChange}
                            accept="application/pdf"
                        />
                        <input
                            type="file"
                            className="hidden"
                            ref={pdfInputRef}
                            onChange={handleFileChange}
                            accept="application/pdf"
                        />

                        {/* Mobile Camera Button */}
                        <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-blue-200 transition-colors h-32 active:bg-slate-50"
                        >
                            <div className="bg-[#eff6ff] w-12 h-12 rounded-full flex items-center justify-center">
                                <Camera className="w-6 h-6 text-[#2563eb]" />
                            </div>
                            <h3 className="font-bold text-[#1e293b] text-sm text-center">Camera</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Take Photo</p>
                        </button>

                        {/* Image Gallery Button */}
                        <button
                            onClick={() => imageInputRef.current?.click()}
                            className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-blue-200 transition-colors h-32 active:bg-slate-50"
                        >
                            <div className="bg-[#f0fdf4] w-12 h-12 rounded-full flex items-center justify-center">
                                <ImagePlus className="w-6 h-6 text-[#16a34a]" />
                            </div>
                            <h3 className="font-bold text-[#1e293b] text-sm text-center">Gallery</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Images Only</p>
                        </button>

                        {/* PDF Document Button */}
                        <button
                            onClick={() => pdfInputRef.current?.click()}
                            className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-red-200 transition-colors h-32 active:bg-slate-50 col-span-2"
                        >
                            <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="font-bold text-[#1e293b] text-sm text-center">PDF</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Document</p>
                        </button>
                    </div>
                ) : (

                    /* State 2: Metadata Form & Preview */
                    <div className="flex flex-col gap-5">

                        {/* Selected File Card */}
                        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-blue-200 flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    {file.type.includes('image') ? <ImageIcon className="w-5 h-5 text-blue-500" /> : <FileIcon className="w-5 h-5 text-blue-500" />}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <p className="font-semibold text-[#1e293b] text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={clearFile}
                                disabled={isUploading}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-red-50 group transition-colors shrink-0"
                            >
                                <X className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                            </button>
                        </div>

                        {/* Metadata Form */}
                        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col gap-4">

                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="font-bold text-[#1e293b] text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#2563eb]" /> Report Details
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {currentDate}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 ml-1">Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Blood Test Result"
                                    className="w-full bg-[#f4f6fa] border-none rounded-xl px-4 py-3.5 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-semibold"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 ml-1">Summary (Optional)</label>
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Brief note about this document..."
                                    rows={3}
                                    className="w-full bg-[#f4f6fa] border-none rounded-xl px-4 py-3.5 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium resize-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || !title.trim()}
                            className="w-full bg-[#2563eb] text-white rounded-xl py-4 font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none mt-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-5 h-5" />
                                    Save to Vault
                                </>
                            )}
                        </button>

                    </div>
                )}
            </div>
        </div>
    )
}
