import UploadClient from './UploadClient'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function UploadPage() {
    return (
        <div className="w-full flex flex-col items-center">

            {/* Header Section */}
            <div className="w-full max-w-sm mt-6 mb-8 relative px-2">
                <Link href="/dashboard" className="absolute -left-2 top-0.5 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Add Document</h1>
                    <p className="text-[#4f5b72] text-sm font-medium">Upload photos or PDFs</p>
                </div>
            </div>

            <UploadClient />
        </div>
    )
}
