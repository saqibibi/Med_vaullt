'use client'

import { useState, useEffect, useTransition } from 'react'
import { Mail, AlertCircle } from 'lucide-react'
import { TextInput } from '@/components/auth/TextInput'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { login } from './actions'
import Link from 'next/link'

interface LoginFormProps {
    serverMessage?: string
}

export function LoginForm({ serverMessage }: LoginFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>(() => {
        if (!serverMessage) return {}
        const lower = serverMessage.toLowerCase()
        let form: string
        if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('grant')) {
            form = 'Invalid email or password.'
        } else if (lower.includes('confirm') || lower.includes('verify') || lower.includes('email_not_confirmed')) {
            form = 'Please verify your email address.'
        } else if (lower.includes('network') || lower.includes('connect') || lower.includes('fetch') || lower.includes('timeout')) {
            form = 'Unable to connect. Try again.'
        } else if (lower.includes('session') || lower.includes('expired')) {
            form = 'Session expired. Please log in again.'
        } else {
            form = 'Invalid email or password.'
        }
        return { form }
    })
    const [, startTransition] = useTransition()

    // Map raw backend errors to friendly messages
    const mapErrorMessage = (msg: string | null | undefined): string | null => {
        if (!msg) return null
        const lower = msg.toLowerCase()
        if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('grant')) {
            return 'Invalid email or password.'
        }
        if (lower.includes('confirm') || lower.includes('verify') || lower.includes('email_not_confirmed')) {
            return 'Please verify your email address.'
        }
        if (lower.includes('network') || lower.includes('connect') || lower.includes('fetch') || lower.includes('timeout')) {
            return 'Unable to connect. Try again.'
        }
        if (lower.includes('session') || lower.includes('expired')) {
            return 'Session expired. Please log in again.'
        }
        return 'Invalid email or password.'
    }

    // Clean up the URL query parameter to avoid showing the error on page reload
    useEffect(() => {
        if (serverMessage && typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            if (url.searchParams.has('message')) {
                url.searchParams.delete('message')
                window.history.replaceState({}, '', url.pathname + url.search)
            }
        }
    }, [serverMessage])

    const isValidEmail = (val: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setEmail(val)
        
        // Clear general form error when typing starts
        if (errors.form) {
            setErrors(prev => ({ ...prev, form: undefined }))
        }

        // If email has error already, re-validate on type
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

        // Clear general form error when typing starts
        if (errors.form) {
            setErrors(prev => ({ ...prev, form: undefined }))
        }

        // If password has error already, re-validate on type
        if (errors.password) {
            let err = ''
            if (!val) {
                err = 'Please enter your password.'
            } else if (val.length >= 6) {
                err = ''
            } else {
                err = 'Password must be at least 6 characters.'
            }
            setErrors(prev => ({ ...prev, password: err }))
        }
    }

    const handleEmailBlur = () => {
        let err = ''
        if (!email.trim()) {
            err = 'Please enter your email.'
        } else if (!isValidEmail(email)) {
            err = 'Please enter a valid email address.'
        }
        setErrors(prev => ({ ...prev, email: err }))
    }

    const handlePasswordBlur = () => {
        let err = ''
        if (!password) {
            err = 'Please enter your password.'
        } else if (password.length < 6) {
            err = 'Password must be at least 6 characters.'
        }
        setErrors(prev => ({ ...prev, password: err }))
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        // Mark all fields as touched (validation already handled below)

        // Perform final validation check
        const emailErr = !email.trim() 
            ? 'Please enter your email.' 
            : (!isValidEmail(email) ? 'Please enter a valid email address.' : '')
            
        const passwordErr = !password 
            ? 'Please enter your password.' 
            : (password.length < 6 ? 'Password must be at least 6 characters.' : '')

        if (emailErr || passwordErr) {
            setErrors({ email: emailErr, password: passwordErr })
            // Focus on first input with error
            if (emailErr) {
                document.getElementById('email')?.focus()
            } else if (passwordErr) {
                document.getElementById('password')?.focus()
            }
            return
        }

        // Clear all validation errors
        setErrors({})

        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                const res = await login(formData)
                if (res?.error) {
                    const friendlyMessage = mapErrorMessage(res.error)
                    setErrors(prev => ({ ...prev, form: friendlyMessage || res.error }))
                } else if (res?.success && res.redirectUrl) {
                    window.location.href = res.redirectUrl
                }
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err))
                console.error('Login action error:', error)
                setErrors(prev => ({ ...prev, form: 'Unable to connect. Try again.' }))
            }
        })
    }

    const handleForgotPasswordClick = (e: React.MouseEvent) => {
        e.preventDefault()
        alert('Password recovery is currently disabled. Please contact your medical portal administrator to reset your password.')
    }

    return (
        <div className="space-y-6">
            {errors.form && (
                <div 
                    role="alert" 
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300"
                >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>{errors.form}</span>
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 ml-1" htmlFor="email">
                        Email
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
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs uppercase tracking-widest font-bold text-zinc-500" htmlFor="password">
                            Password
                        </label>
                        <Link 
                            href="#" 
                            onClick={handleForgotPasswordClick}
                            className="flex-shrink-0 text-xs font-bold text-white/60 hover:text-white transition-colors"
                        >
                            Forgot?
                        </Link>
                    </div>
                    <PasswordInput 
                        id="password" 
                        name="password" 
                        placeholder="••••••••" 
                        autoComplete="current-password"
                        value={password}
                        error={errors.password}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        required
                    />
                </div>

                <div className="pt-2">
                    <SubmitButton>Sign In to Vault</SubmitButton>
                </div>
            </form>
        </div>
    )
}
