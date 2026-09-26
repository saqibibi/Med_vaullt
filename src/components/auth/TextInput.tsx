import { ElementType, FocusEventHandler, ChangeEventHandler } from 'react'

interface TextInputProps {
    id: string
    name: string
    type: string
    placeholder: string
    required?: boolean
    autoComplete?: string
    icon: ElementType
    error?: string
    value?: string
    onChange?: ChangeEventHandler<HTMLInputElement>
    onBlur?: FocusEventHandler<HTMLInputElement>
    autoFocus?: boolean
}

export function TextInput({
    id,
    name,
    type,
    placeholder,
    required = true,
    autoComplete,
    icon: Icon,
    error,
    value,
    onChange,
    onBlur,
    autoFocus
}: TextInputProps) {

    const hasError = !!error

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
                    <Icon className="w-5 h-5" />
                </div>
                <input
                    id={id}
                    name={name}
                    type={type}
                    required={required}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    autoFocus={autoFocus}
                    aria-invalid={hasError ? 'true' : 'false'}
                    aria-describedby={hasError ? `${id}-error` : undefined}
                    className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all outline-none peer ${
                        hasError 
                            ? 'border-red-500/40 focus:ring-red-500/10 focus:border-red-500' 
                            : 'border-slate-200 focus:ring-primary/10 focus:border-primary/50'
                    }`}
                />
            </div>
            {hasError && (
                <p 
                    id={`${id}-error`} 
                    role="alert" 
                    className="text-xs text-red-500 ml-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
                >
                    {error}
                </p>
            )}
        </div>
    )
}

