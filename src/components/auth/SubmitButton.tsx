'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, ArrowRight } from 'lucide-react'

interface SubmitButtonProps {
    children: React.ReactNode
    className?: string
}

export function SubmitButton({ children, className = '' }: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className={`group relative w-full flex justify-center items-center gap-2 bg-white text-black hover:bg-zinc-200 disabled:bg-[#ffffff15] disabled:text-zinc-500 disabled:cursor-not-allowed rounded-2xl px-4 py-4 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[56px] ${className}`}
        >
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                    <span className="font-semibold text-zinc-400">Signing in...</span>
                </>
            ) : (
                <>
                    <span>{children}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
            )}
        </button>
    )
}

