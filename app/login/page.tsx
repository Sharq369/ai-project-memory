'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // This handles the actual connection to Supabase
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // We assume you have a basic supabase client set up. 
    // If this fails, we can fix the import path later.
    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard'); // Send them to the Vault
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* 1. Ambient Background Glow (Consistent with Landing Page) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* 2. Glassmorphic Auth Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group cursor-pointer">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Lock className="text-black w-5 h-5" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {isSignUp ? 'Create Secure Access' : 'Welcome Back'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Initialize your encrypted memory vault.' : 'Enter your credentials to access the vault.'}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle shine effect on top border */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">Email Coordinates</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all placeholder:text-gray-600"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">Encrypted Key</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-3.5 text-gray-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Initialize Vault' : 'Unlock Vault'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have access? ' : 'Need a secure vault? '}
              <span className="underline decoration-white/30 hover:decoration-white underline-offset-4">
                {isSignUp ? 'Sign in' : 'Request access'}
              </span>
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-widest">
          End-to-End Encrypted • 2026 Security Protocols
        </p>
      </div>
    </div>
  );
}
