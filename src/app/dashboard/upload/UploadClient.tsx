'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { UploadCloud, File as FileIcon, X, CheckCircle2, Loader2, Image as ImageIcon, Camera, ImagePlus, FileText, Calendar } from 'lucide-react'

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
            const { error: uploadError } = await supabase.storage
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

        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err))
            console.error(error)
            setError(error.message || "Failed to upload file")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="w-full flex justify-center pb-8 select-none">
            <div className="w-full max-w-sm flex flex-col gap-6">

                {success && (
                    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col justify-center items-center">
                        <CheckCircle2 className="w-20 h-20 text-[#4ade80] mb-4 animate-bounce" />
                        <h2 className="text-2xl font-extrabold text-[#1e293b] mb-1">Upload Complete!</h2>
                        <p className="text-slate-500 font-semibold">Redirecting to dashboard...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-100 font-semibold z-10 relative">
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

                        {/* Mobile Camera Button */}
                        <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-primary/30 transition-all h-32 active:bg-slate-50 cursor-pointer"
                        >
                            <div className="bg-sky-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                                <Camera className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm text-center">Camera</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Take Photo</p>
                        </button>

                        {/* Image Gallery Button */}
                        <button
                            onClick={() => imageInputRef.current?.click()}
                            className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-primary/30 transition-all h-32 active:bg-slate-50 cursor-pointer"
                        >
                            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                                <ImagePlus className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm text-center">Gallery</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Images</p>
                        </button>

                        {/* PDF Document Button */}
                        <button
                            onClick={() => pdfInputRef.current?.click()}
                            className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-red-200 transition-all h-32 active:bg-slate-50 col-span-2 cursor-pointer"
                        >
                            <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm text-center">PDF</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Document</p>
                        </button>
                    </div>
                ) : (

                    /* State 2: Metadata Form & Preview */
                    <div className="flex flex-col gap-5">

                        {/* Selected File Card */}
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                                    {file.type.includes('image') ? <ImageIcon className="w-5 h-5 text-primary" /> : <FileIcon className="w-5 h-5 text-primary" />}
                                </div>
                                <div className="flex flex-col overflow-hidden min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-slate-400 font-semibold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={clearFile}
                                disabled={isUploading}
                                className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 text-slate-400 transition-all shrink-0 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Metadata Form */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">

                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> Report Details
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {currentDate}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Blood Test Result"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Summary (Optional)</label>
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Brief note about this document..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold resize-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || !title.trim()}
                            className="w-full bg-primary hover:bg-sky-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-sky-600/10 transition-all hover:translate-y-[-1px] active:translate-y-[0px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none mt-2 cursor-pointer text-sm"
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
