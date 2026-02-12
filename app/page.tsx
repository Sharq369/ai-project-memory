import Link from 'next/link';
import { Shield, Brain, Zap, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-hidden font-sans">
      
      {/* VIP Spotlights (from your image) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Brain className="text-black w-5 h-5" />
          </div>
          <span className="font-bold tracking-tighter text-xl uppercase">Project Memory</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#about" className="hover:text-white transition-colors">Resources</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white">Login</Link>
          <Link href="/login" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
            Start Creating
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        <h1 className="max-w-4xl text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
          Secure. Integrate. <br />
          <span className="text-gray-500">AI Memory Vault.</span>
        </h1>

        <p className="max-w-2xl text-gray-400 text-lg md:text-xl mb-12 leading-relaxed">
          The ultra-secure infrastructure for your AI context. <br className="hidden md:block" />
          Store complex project data and retrieve it with millisecond latency.
        </p>

        {/* The Central Image / Vault Concept */}
        <div className="relative w-full max-w-4xl mx-auto mt-12 group">
          {/* Glowing Aura behind the vault */}
          <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-700" />
          
          <div className="relative aspect-video rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden">
             {/* Large "Vault" Iconography */}
             <div className="relative">
                <Shield className="w-32 h-32 text-white/20 stroke-[1px]" />
                <Brain className="absolute inset-0 m-auto w-12 h-12 text-white animate-pulse" />
             </div>
             
             <div className="mt-8 flex flex-col items-center">
                <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-mono flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  SYSTEM_STATUS: ENCRYPTED
                </div>
             </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16">
          <button className="group flex items-center gap-2 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl hover:bg-white/10 transition-all">
            <span className="font-semibold">Get a Paal Bot</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

    </main>
  );
}
