"use client";

import React, { useEffect, useState, memo, useCallback } from 'react';
import { 
  User, Mail, Shield, Zap, Activity, 
  Cpu, ArrowUpRight, Fingerprint, Lock, CheckCircle2, Database
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { getLimits, PlanType, PLAN_LABELS, PLAN_DESCRIPTIONS } from '../../../lib/plans';

// ------------------------------------------------------------------
// 1. REUSABLE UI COMPONENTS (Matched exactly to Dashboard)
// ------------------------------------------------------------------

const Card = memo(({ children, className = '', glowColor = 'none' }: { children: React.ReactNode; className?: string; glowColor?: 'fuchsia' | 'cyan' | 'none' }) => {
  const edgeGlows = {
    fuchsia: 'bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-[0_2px_20px_-2px_rgba(217,70,239,0.7)]',
    cyan: 'bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_2px_20px_-2px_rgba(34,211,238,0.7)]',
    none: 'bg-transparent'
  };
  return (
    <div className={`relative overflow-hidden rounded-xl border border-[#1a1a3a] bg-[#0b0b16]/80 backdrop-blur-xl p-6 shadow-2xl ${className}`}>
      {glowColor !== 'none' && (
        <>
          <div className={`absolute top-0 left-0 right-0 h-[1px] ${edgeGlows[glowColor]} opacity-100`} />
          <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none" />
        </>
      )}
      {children}
    </div>
  );
});
Card.displayName = "Card";

// ------------------------------------------------------------------
// 2. MAIN PROFILE PAGE
// ------------------------------------------------------------------

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [userProfile, setUserProfile] = useState<{
    id: string;
    email: string;
    plan: PlanType;
    createdAt: string;
  } | null>(null);

  const [usage, setUsage] = useState({
    aiMessages: 0,
    decomposerRuns: 0
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProfileData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type, created_at')
        .eq('id', user.id)
        .single();

      const plan = (profile?.plan_type as PlanType) || 'free';
      
      setUserProfile({
        id: user.id,
        email: user.email || 'Unknown',
        plan: plan,
        createdAt: profile?.created_at || new Date().toISOString()
      });

      // Get Today's Usage (AI Messages & Decomposer Runs)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayIso = startOfDay.toISOString();

      const [msgRes, decompRes] = await Promise.all([
        supabase.from('ai_message_log').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayIso),
        supabase.from('decomposer_log').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayIso)
      ]);

      setUsage({
        aiMessages: msgRes.count || 0,
        decomposerRuns: decompRes.count || 0
      });

    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, []); // supabase client is stable — no need in deps

  useEffect(() => {
    setMounted(true);
    fetchProfileData();
  }, [fetchProfileData]);

  if (!mounted) return <div className="min-h-screen bg-[#030308]" />;

  const limits = userProfile ? getLimits(userProfile.plan) : getLimits('free');

  // Calculate percentages safely
  const msgPercent = limits.aiMessagesPerDay === Infinity ? 100 : Math.min((usage.aiMessages / limits.aiMessagesPerDay) * 100, 100);
  const decompPercent = limits.decomposerRunsPerDay === Infinity ? 100 : Math.min((usage.decomposerRuns / limits.decomposerRunsPerDay) * 100, 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#030308] text-slate-200 font-sans selection:bg-cyan-500/30 relative">
      
      {/* Ambient background (Matches Dashboard) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(217,70,239,0.03),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.03),transparent_40%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1 bg-gradient-to-b from-cyan-400 to-fuchsia-600 shadow-[0_0_15px_#22d3ee]" />
            <div>
              <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-1">Identity Matrix</p>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-md">Operative Profile</h1>
            </div>
          </div>
          
          {!loading && userProfile && (
            <div className="hidden md:flex px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl items-center gap-3">
              <Shield size={16} className="text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-100">
                {PLAN_LABELS[userProfile.plan]} Tier
              </span>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Activity className="text-cyan-400 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Decrypting Identity...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column: Identity & Security */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Core Identity Card */}
              <Card glowColor="cyan" className="overflow-visible">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0b0b16] to-[#1a1a3a] flex items-center justify-center border border-cyan-500/30 relative z-10 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                      <User size={40} className="text-cyan-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#0b0b16] rounded-full border border-[#1a1a3a] flex items-center justify-center z-20">
                      <CheckCircle2 size={16} className="text-green-500" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                      {userProfile?.email.split('@')[0]}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-slate-400 font-mono mb-4">
                      <Mail size={14} className="text-slate-500" />
                      {userProfile?.email}
                    </div>
                    
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-[#05050a] px-4 py-2 rounded-lg border border-white/5 inline-flex">
                      <Fingerprint size={12} />
                      UUID: <span className="text-slate-300">{userProfile?.id.split('-')[0]}...</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Neural Capacity / Daily Usage Card */}
              <Card glowColor="fuchsia">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[11px] flex items-center gap-2 uppercase font-black text-white tracking-widest">
                    <Activity size={14} className="text-fuchsia-400" /> Daily Neural Usage
                  </h3>
                  <span className="text-[9px] text-slate-500 font-mono">RESETS AT 00:00 UTC</span>
                </div>

                <div className="space-y-8">
                  {/* AI Chat Usage */}
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-slate-300">AI Logic Cycles</span>
                      <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                        {usage.aiMessages} <span className="text-slate-500">/ {limits.aiMessagesPerDay === Infinity ? '∞' : limits.aiMessagesPerDay}</span>
                      </span>
                    </div>
                    <div className="w-full h-[6px] bg-[#05050a] rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] border border-white/5">
                      <div 
                        className={`h-full relative transition-all duration-1000 ${limits.aiMessagesPerDay === Infinity ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-400' : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]'}`}
                        style={{ width: `${msgPercent}%` }}
                      >
                        <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white/30 to-transparent mix-blend-overlay" />
                      </div>
                    </div>
                  </div>

                  {/* Decomposer Usage */}
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-slate-300">Decomposer Executions</span>
                      <span className="text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">
                        {usage.decomposerRuns} <span className="text-slate-500">/ {limits.decomposerRunsPerDay === Infinity ? '∞' : limits.decomposerRunsPerDay}</span>
                      </span>
                    </div>
                    <div className="w-full h-[6px] bg-[#05050a] rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] border border-white/5">
                      <div 
                        className={`h-full relative transition-all duration-1000 ${limits.decomposerRunsPerDay === Infinity ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-400' : 'bg-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.8)]'}`}
                        style={{ width: `${decompPercent}%` }}
                      >
                         <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white/30 to-transparent mix-blend-overlay" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hard Limits Display */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5">
                  <div className="bg-[#05050a] p-4 rounded-xl border border-white/5">
                    <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Vault Projects</span>
                    <span className="text-lg font-black text-white tracking-tighter">
                      {limits.projects === Infinity ? 'Unlimited' : limits.projects}
                    </span>
                  </div>
                  <div className="bg-[#05050a] p-4 rounded-xl border border-white/5">
                    <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Sync Context</span>
                    <span className="text-lg font-black text-white tracking-tighter">
                      {limits.filesPerSync === Infinity ? 'Unlimited' : limits.filesPerSync} <span className="text-sm text-slate-500">Files</span>
                    </span>
                  </div>
                  <div className="bg-[#05050a] p-4 rounded-xl border border-white/5">
                    <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Memory Vault Limit</span>
                    <span className="text-lg font-black text-white tracking-tighter">
                      {limits.memoriesLimit === Infinity ? 'Unlimited' : limits.memoriesLimit} <span className="text-sm text-slate-500">Entries</span>
                    </span>
                  </div>
                  <div className="bg-[#05050a] p-4 rounded-xl border border-white/5">
                    <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Memory Editing</span>
                    <span className="text-lg font-black text-white tracking-tighter">
                      {limits.memoryEdit ? <span className="text-green-400">Enabled</span> : <span className="text-slate-600">Locked</span>}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Active Plan & Settings */}
            <div className="xl:col-span-1 space-y-6">
              
              <Card glowColor="none" className="flex flex-col h-full border-fuchsia-500/20 bg-gradient-to-b from-[#101024]/50 to-[#0b0b16]">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center mb-6">
                    <Cpu className="text-fuchsia-400" size={24} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                    {PLAN_LABELS[userProfile?.plan || 'free']}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-6">
                    {PLAN_DESCRIPTIONS[userProfile?.plan || 'free']}
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-slate-300">
                      <Lock size={12} className={limits.privateRepos ? "text-green-400" : "text-slate-600"} /> 
                      Private Repositories
                    </div>
                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-slate-300">
                      <Zap size={12} className={limits.webhookAutoSync ? "text-green-400" : "text-slate-600"} /> 
                      Webhook Auto-Sync
                    </div>
                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-slate-300">
                      <Database size={12} className={limits.dataExport ? "text-green-400" : "text-slate-600"} /> 
                      Full Data Export
                    </div>
                  </div>
                </div>

                <Link href="/dashboard/settings" className="block w-full">
                  <button className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center justify-center gap-2 group">
                    Manage Access <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </Link>
              </Card>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
