'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, Fingerprint, Activity } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setSuccessMsg('Check your email for the confirmation link.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // 🚀 THE FIX: Force a hard browser navigation directly to your projects dashboard.
        // This ensures middleware.ts runs and secures the cookie before the page loads.
        window.location.href = '/dashboard/projects'
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Neural Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#111] border border-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Lock className="text-gray-300 relative z-10" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            {isSignUp ? 'Initialize Access' : 'Welcome Back'}
          </h1>
          <p className="text-gray-500 text-sm">
            Enter your credentials to access the vault.
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent" />

          {error && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <ShieldCheck className="mt-0.5 flex-shrink-0" size={16} />
              <p>{error}</p>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-950/30 border border-green-900/50 rounded-xl flex items-start gap-3 text-green-400 text-sm">
              <ShieldCheck className="mt-0.5 flex-shrink-0" size={16} />
              <p>{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider pl-1">
                Email Coordinates
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-gray-600" size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-gray-800 text-white text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all placeholder:text-gray-700"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Encrypted Key
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ShieldCheck className="text-gray-600" size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-gray-800 text-white text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all placeholder:text-gray-700 font-mono tracking-widest"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-200 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isSignUp ? 'Initialize Profile' : 'Unlock Vault'}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setSuccessMsg(null)
              }}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {isSignUp 
                ? "Already have clearance? Access vault" 
                : "Need a secure vault? Request access"}
            </button>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="mt-12 flex items-center justify-center gap-4 text-[10px] font-mono text-gray-700 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Fingerprint size={12} /> END-TO-END ENCRYPTED
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Activity size={12} className="text-green-500/50" /> 2026 SECURITY PROTOCOLS
          </span>
        </div>
      </div>
    </div>
  )
}
