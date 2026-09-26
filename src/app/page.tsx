import Link from 'next/link'
import { ArrowRight, Shield, Database, Lock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-background text-foreground">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center z-10">
        <div className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary" />
          <span>Med Vault</span>
        </div>
        <Link
          href="/login"
          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/10 transition-all rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-4 text-center z-10 my-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-100/50 text-xs font-bold text-sky-700 mb-8 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Secure Clinical Storage
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-[1.15]">
          The Secure Portal <br className="hidden md:block" /> for Medical Records
        </h1>

        <p className="text-base md:text-lg text-slate-500 mb-10 max-w-xl leading-relaxed">
          Store, organize, and retrieve sensitive medical documentation with enterprise-grade encryption and access protocols designed for clinical workflows.
        </p>

        <Link
          href="/signup"
          className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-sky-600 text-white rounded-xl px-8 py-4 text-base font-bold transition-all transform hover:scale-[1.01] shadow-lg shadow-sky-600/20"
        >
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </main>

      {/* Feature Grid */}
      <div className="w-full max-w-6xl mx-auto px-4 pb-24 z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption protecting patient data at rest and in transit." },
          { icon: Database, title: "Secure Data Storage", desc: "Store clinical files, medical scans, and histories without space limits." },
          { icon: Lock, title: "Emergency Protocols", desc: "Instantly share critical alerts with first responders via secure QR scans." }
        ].map((feature, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-sky-100 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mb-6">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
