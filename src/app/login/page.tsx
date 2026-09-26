import Link from 'next/link'
import { Shield } from 'lucide-react'
import { LoginForm } from './login-form'

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string }>
}) {
    const searchParams = await props.searchParams;
    const message = searchParams.message;

    return (
        <div className="flex min-h-screen bg-background selection:bg-primary/20 text-slate-800 font-sans">
            {/* Left Side - Branding / Illustration */}
            <div className="hidden lg:flex w-1/2 p-12 flex-col justify-between relative border-r border-slate-200/50 bg-slate-50/50 overflow-hidden">
                {/* Subtle Ambient Gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-sky-400/5 blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/5 blur-[120px] pointer-events-none" />
                
                {/* Decorative Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

                {/* Brand Header */}
                <div className="z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                        <Shield className="w-5.5 h-5.5 fill-white text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900 tracking-tight text-[17px] leading-tight">Med Vault</span>
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wide">Your Health, Our Priority</span>
                    </div>
                </div>
                
                <div className="z-10 mt-auto">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter max-w-xl leading-[1.15] mb-6">
                        Secure medical records. <br />
                        <span className="text-slate-400 font-bold">Encrypted end-to-end.</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1,2,3,4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-slate-200" />
                            ))}
                        </div>
                        <p className="text-slate-500 text-sm font-semibold">
                            Trusted by 10,000+ professionals.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Mobile Background Elements */}
                <div className="absolute inset-0 lg:hidden user-select-none pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-sky-400/5 blur-[120px]" />
                </div>

                <div className="w-full max-w-[400px] z-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="mb-10 text-center lg:text-left">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex items-center justify-center gap-3 mb-8 w-full">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                                <Shield className="w-5.5 h-5.5 fill-white text-blue-600" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="font-extrabold text-slate-900 tracking-tight text-[17px] leading-tight">Med Vault</span>
                                <span className="text-[10px] text-slate-400 font-semibold tracking-wide">Your Health, Our Priority</span>
                            </div>
                        </div>
                        
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome back</h2>
                        <p className="text-slate-500 text-sm font-medium">
                            Enter your credentials to access your vault
                        </p>
                    </div>

                    <LoginForm serverMessage={message} />

                    <div className="mt-10 text-center lg:text-left">
                        <p className="text-slate-500 text-sm font-medium">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-primary font-bold hover:text-sky-600 transition-colors">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}