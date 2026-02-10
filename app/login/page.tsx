'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-500 mt-2">AI Project Memory Manager</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? "Need an account? Sign Up" : "Have an account? Log In"}
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-slate-400">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
