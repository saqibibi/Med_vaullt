'use client'

import { useState, KeyboardEvent, FocusEvent, FocusEventHandler, ChangeEventHandler } from 'react'
import { Eye, EyeOff, Lock, ArrowUp } from 'lucide-react'

interface PasswordInputProps {
    id: string
    name: string
    placeholder: string
    required?: boolean
    autoComplete?: string
    error?: string
    value?: string
    onChange?: ChangeEventHandler<HTMLInputElement>
    onBlur?: FocusEventHandler<HTMLInputElement>
}

export function PasswordInput({
    id,
    name,
    placeholder,
    required = true,
    autoComplete,
    error,
    value,
    onChange,
    onBlur
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [capsLockActive, setCapsLockActive] = useState(false)

    const hasError = !!error

    const checkCapsLock = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.getModifierState('CapsLock')) {
            setCapsLockActive(true)
        } else {
            setCapsLockActive(false)
        }
    }

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        setCapsLockActive(false)
        if (onBlur) onBlur(e)
    }

    return (
        <div className="space-y-1.5 w-full">
            <div className="relative group">
                <div 
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                        hasError 
                            ? 'text-red-500 group-focus-within:text-red-600' 
                            : 'text-slate-400 group-focus-within:text-primary'
                    }`}
                >
                    <Lock className="w-5 h-5" />
                </div>
                <input
                    id={id}
                    name={name}
                    type={showPassword ? 'text' : 'password'}
                    required={required}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    onKeyDown={checkCapsLock}
                    onKeyUp={checkCapsLock}
                    aria-invalid={hasError ? 'true' : 'false'}
                    aria-describedby={hasError ? `${id}-error` : undefined}
                    className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-12 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all outline-none peer ${
                        hasError 
                            ? 'border-red-500/40 focus:ring-red-500/10 focus:border-red-500' 
                            : 'border-slate-200 focus:ring-primary/10 focus:border-primary/50'
                    }`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                    ) : (
                        <Eye className="w-5 h-5" />
                    )}
                </button>
            </div>
            
            {/* Warning / Error Messages Container */}
            <div className="flex flex-col gap-1 px-1">
                {capsLockActive && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
                        <ArrowUp className="w-3.5 h-3.5 border border-amber-500/30 rounded px-[2px] py-[1px] bg-amber-50" />
                        <span>Caps Lock is active</span>
                    </div>
                )}
                {hasError && (
                    <p 
                        id={`${id}-error`} 
                        role="alert" 
                        className="text-xs text-red-500 font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                        {error}
                    </p>
                )}
            </div>
        </div>
    )
}

