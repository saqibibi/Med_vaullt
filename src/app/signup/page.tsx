import { signup } from './actions'
import Link from 'next/link'

export default function SignupPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

            <div className="glass p-10 rounded-2xl w-full max-w-md z-10 mx-4 shadow-2xl relative">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Med Vault</h1>
                    <p className="text-muted-foreground">Create a secure vault account</p>
                </div>

                {searchParams?.message && (
                    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                        {searchParams.message}
                    </div>
                )}

                <form action={signup} className="flex flex-col gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80" htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                        />
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 font-medium transition-all transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                        >
                            Sign Up
                        </button>
                        <Link
                            href="/login"
                            className="w-full flex justify-center items-center bg-transparent border border-border/50 hover:bg-white/5 text-foreground rounded-lg px-4 py-3 font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Already have an account? Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
