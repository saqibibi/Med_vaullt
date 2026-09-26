'use client'

import { useState, useEffect, useTransition } from 'react'
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import { TextInput } from '@/components/auth/TextInput'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { signup } from './actions'

interface SignupFormProps {
    serverMessage?: string
}

export function SignupForm({ serverMessage }: SignupFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
    const [infoMessage, setInfoMessage] = useState<string | null>(null)
    const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
    const [isPending, startTransition] = useTransition()

    // Map raw backend errors to friendly messages
    const mapErrorMessage = (msg: string | null | undefined): string | null => {
        if (!msg) return null
        const lower = msg.toLowerCase()
        if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('already registered')) {
            return 'An account with this email already exists.'
        }
        if (lower.includes('weak password') || lower.includes('should be at least')) {
            return 'Password is too weak. Must be at least 6 characters.'
        }
        if (lower.includes('network') || lower.includes('connect') || lower.includes('fetch') || lower.includes('timeout')) {
            return 'Unable to connect. Try again.'
        }
        return msg // Keep standard messages unless mapped
    }

    // Effect to handle server messages passed through URL query parameters
    useEffect(() => {
        if (serverMessage) {
            const isInfo = serverMessage.toLowerCase().includes('verify') || serverMessage.toLowerCase().includes('check your email')
            if (isInfo) {
                setInfoMessage(serverMessage)
            } else {
                const friendlyMessage = mapErrorMessage(serverMessage)
                if (friendlyMessage) {
                    setErrors(prev => ({ ...prev, form: friendlyMessage }))
                }
            }

            // Clean up the URL query parameter to avoid showing the alert on reload
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href)
                if (url.searchParams.has('message')) {
                    url.searchParams.delete('message')
                    window.history.replaceState({}, '', url.pathname + url.search)
                }
            }
        }
    }, [serverMessage])

    const isValidEmail = (val: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setEmail(val)
        
        // Clear alerts on active typing
        if (errors.form) setErrors(prev => ({ ...prev, form: undefined }))
        if (infoMessage) setInfoMessage(null)

        if (errors.email) {
            let err = ''
            if (!val.trim()) {
                err = 'Please enter your email.'
            } else if (isValidEmail(val)) {
                err = ''
            } else {
                err = 'Please enter a valid email address.'
            }
            setErrors(prev => ({ ...prev, email: err }))
        }
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setPassword(val)

        // Clear alerts on active typing
        if (errors.form) setErrors(prev => ({ ...prev, form: undefined }))
        if (infoMessage) setInfoMessage(null)

        if (errors.password) {
            let err = ''
            if (!val) {
                err = 'Please create a password.'
            } else if (val.length >= 6) {
                err = ''
            } else {
                err = 'Password must be at least 6 characters.'
            }
            setErrors(prev => ({ ...prev, password: err }))
        }
    }

    const handleEmailBlur = () => {
        setTouched(prev => ({ ...prev, email: true }))
        let err = ''
        if (!email.trim()) {
            err = 'Please enter your email.'
        } else if (!isValidEmail(email)) {
            err = 'Please enter a valid email address.'
        }
        setErrors(prev => ({ ...prev, email: err }))
    }

    const handlePasswordBlur = () => {
        setTouched(prev => ({ ...prev, password: true }))
        let err = ''
        if (!password) {
            err = 'Please create a password.'
        } else if (password.length < 6) {
            err = 'Password must be at least 6 characters.'
        }
        setErrors(prev => ({ ...prev, password: err }))
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        setTouched({ email: true, password: true })

        // Perform validation
        const emailErr = !email.trim() 
            ? 'Please enter your email.' 
            : (!isValidEmail(email) ? 'Please enter a valid email address.' : '')
            
        const passwordErr = !password 
            ? 'Please create a password.' 
            : (password.length < 6 ? 'Password must be at least 6 characters.' : '')

        if (emailErr || passwordErr) {
            setErrors({ email: emailErr, password: passwordErr })
            if (emailErr) {
                document.getElementById('email')?.focus()
            } else if (passwordErr) {
                document.getElementById('password')?.focus()
            }
            return
        }

        setErrors({})
        setInfoMessage(null)

        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                const res = await signup(formData)
                if (res?.error) {
                    const friendlyMessage = mapErrorMessage(res.error)
                    setErrors(prev => ({ ...prev, form: friendlyMessage || res.error }))
                } else if (res?.success) {
                    if (res.message) {
                        setInfoMessage(res.message)
                    } else if (res.redirectUrl) {
                        window.location.href = res.redirectUrl
                    }
                }
            } catch (err: any) {
                console.error('Signup action error:', err)
                setErrors(prev => ({ ...prev, form: 'Unable to connect. Try again.' }))
            }
        })
    }

    return (
        <div className="space-y-6">
            {errors.form && (
                <div 
                    role="alert" 
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300"
                >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span>{errors.form}</span>
                </div>
            )}

            {infoMessage && (
                <div 
                    role="status" 
                    className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300"
                >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{infoMessage}</span>
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-500 ml-1" htmlFor="email">
                        Email Address
                    </label>
                    <TextInput 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="name@medical.com" 
                        autoComplete="email"
                        icon={Mail}
                        value={email}
                        error={errors.email}
                        onChange={handleEmailChange}
                        onBlur={handleEmailBlur}
                        autoFocus
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-500 ml-1" htmlFor="password">
                        Create Password
                    </label>
                    <PasswordInput 
                        id="password" 
                        name="password" 
                        placeholder="••••••••" 
                        autoComplete="new-password"
                        value={password}
                        error={errors.password}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        required
                    />
                </div>

                <div className="pt-2">
                    <SubmitButton>Establish Vault</SubmitButton>
                </div>
            </form>
        </div>
    )
}
