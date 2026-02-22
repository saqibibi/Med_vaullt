import Link from 'next/link'
import { ArrowRight, Shield, Database, Lock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto p-6 mt-4 flex justify-between items-center z-10">
        <div className="text-xl font-bold tracking-tight">Med Vault</div>
        <Link
          href="/login"
          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all rounded-full px-5 py-2 text-sm font-medium"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-4 text-center z-10 mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Secure Enterprise Storage
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
          The Secure Portal <br className="hidden md:block" /> for Medical Assets
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          Store, manage, and verify sensitive documentation with our enterprise-grade encryption and intuitive interface.
        </p>

        <Link
          href="/signup"
          className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-4 text-lg font-medium transition-all transform hover:scale-[1.02] shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
        >
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </main>

      {/* Feature Grid */}
      <div className="w-full max-w-6xl mx-auto px-4 pb-24 z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption for all your medical data." },
          { icon: Database, title: "Unlimited Storage", desc: "Scale effortlessly without worrying about limits." },
          { icon: Lock, title: "Role-Based Access", desc: "Granular control over who sees what." }
        ].map((feature, i) => (
          <div key={i} className="glass p-8 rounded-2xl border border-white/5 hover:bg-white/[0.02] transition-colors">
            <feature.icon className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
