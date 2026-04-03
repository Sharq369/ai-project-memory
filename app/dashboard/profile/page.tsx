"use client";

import React, { useEffect, useState, memo, useCallback } from 'react';
import {
  User, Mail, Shield, Zap, Activity,
  Cpu, ArrowUpRight, Fingerprint, Lock, CheckCircle2,
  Database, Edit3, X, Save, AlertCircle, Camera, Eye, EyeOff, KeyRound, Loader2
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { getLimits, PlanType, PLAN_LABELS, PLAN_DESCRIPTIONS, isDeveloper } from '../../../lib/plans';

// ------------------------------------------------------------------
// 1. REUSABLE UI COMPONENTS (Matched exactly to Dashboard)
// ------------------------------------------------------------------

const Card = memo(({ children, className = '', glowColor = 'none' }: {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'fuchsia' | 'cyan' | 'none';
}) => {
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

  // ── Edit Modal State ────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const [userProfile, setUserProfile] = useState<{
    id: string;
    email: string;
    plan: PlanType;
    createdAt: string;
    displayName?: string;
    avatarUrl?: string | null;
  } | null>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
        .select('plan_type, updated_at, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      // Check if developer, override plan if true
      let plan = (profile?.plan_type as PlanType) || 'free';
      if (isDeveloper(user.id)) {
        plan = 'platinum';
      }

      setUserProfile({
        id: user.id,
        email: user.email || 'Unknown',
        plan: plan,
        createdAt: profile?.updated_at || new Date().toISOString(),
        displayName: profile?.display_name || '',
        avatarUrl: profile?.avatar_url || null,
      });

      // Initialise the edit field with current display name
      setEditDisplayName(profile?.display_name || '');

      // Get Today's Usage
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
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProfileData();
  }, [fetchProfileData]);

  // ── Save display name via server route — bypasses RLS completely ─────────────
  const handleSaveProfile = async () => {
    if (!userProfile) return;
    setEditSaving(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: editDisplayName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      // Update local state immediately — persists on refresh via DB
      setUserProfile(prev => prev ? { ...prev, displayName: editDisplayName.trim() } : prev);
      setEditSuccess(true);
      setTimeout(() => { setShowEditModal(false); setEditSuccess(false); }, 1200);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to save. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;
    if (file.size > 2 * 1024 * 1024) { setEditError('Image must be under 2MB.'); return; }
    setIsUploadingAvatar(true); setEditError(null);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${userProfile.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      // Persist to profiles table
      // Save avatar_url via server route — bypasses RLS
      const saveRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl })
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || 'Failed to save avatar URL.');
      // Update local state — persists across refresh via DB
      setUserProfile(prev => prev ? { ...prev, avatarUrl: publicUrl } : prev);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 2000);
    } catch (err: any) {
      setEditError(err?.message || 'Upload failed.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Password change ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setEditError(null); setEditSuccess(false);
    if (!newPassword) { setEditError('Enter a new password.'); return; }
    if (newPassword.length < 8) { setEditError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setEditError('Passwords do not match.'); return; }
    setIsSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword(''); setConfirmPassword('');
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 2000);
    } catch (err: any) {
      setEditError(err?.message || 'Password update failed.');
    } finally {
      setIsSavingPw(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#030308]" />;

  const limits = userProfile ? getLimits(userProfile.plan) : getLimits('free');

  const msgPercent = limits.aiMessagesPerDay === Infinity
    ? 100
    : Math.min((usage.aiMessages / limits.aiMessagesPerDay) * 100, 100);
  const decompPercent = limits.decomposerRunsPerDay === Infinity
    ? 100
    : Math.min((usage.decomposerRuns / limits.decomposerRunsPerDay) * 100, 100);

  // Displayed name: prefer display name, fall back to email prefix
  const displayedName = userProfile?.displayName || userProfile?.email.split('@')[0] || '';

  return (
    // ── ROOT wrapper — modal lives inside here ──────────────────────
    <div className="min-h-[calc(100vh-4rem)] bg-[#030308] text-slate-200 font-sans selection:bg-cyan-500/30 relative">

      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(217,70,239,0.03),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.03),transparent_40%)] pointer-events-none" />

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
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

            {/* Left Column */}
            <div className="xl:col-span-2 space-y-6">

              {/* Core Identity Card */}
              <Card glowColor="cyan" className="overflow-visible">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0b0b16] to-[#1a1a3a] flex items-center justify-center border border-cyan-500/30 relative z-10 shadow-[0_0_20px_rgba(34,211,238,0.2)] overflow-hidden">
                      {userProfile?.avatarUrl
                        ? <img src={userProfile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        : <User size={40} className="text-cyan-400" />}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#0b0b16] rounded-full border border-[#1a1a3a] flex items-center justify-center z-20">
                      <CheckCircle2 size={16} className="text-green-500" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        {displayedName}
                      </h2>
                      {/* Edit Profile Button */}
                      <button
                        onClick={() => {
                          setEditDisplayName(userProfile?.displayName || '');
                          setEditError(null);
                          setEditSuccess(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setShowEditModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-slate-500 hover:text-cyan-400 transition-all duration-200"
                        title="Edit display name"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>

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
                      {limits.memoryEdit
                        ? <span className="text-green-400">Enabled</span>
                        : <span className="text-slate-600">Locked</span>}
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

      {/* ── EDIT PROFILE MODAL ─────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#1a1a3a] bg-[#07070f] shadow-2xl overflow-hidden">

            {/* Modal top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Edit3 size={14} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em]">Identity Matrix</p>
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">Edit Profile</h2>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-5">

              {/* ── AVATAR UPLOAD ── */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0b0b16] to-[#1a1a3a] border border-cyan-500/30 flex items-center justify-center overflow-hidden shrink-0">
                    {userProfile?.avatarUrl
                      ? <img src={userProfile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <User size={26} className="text-cyan-400" />}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all">
                    {isUploadingAvatar ? <Loader2 size={12} className="animate-spin text-cyan-400" /> : <Camera size={12} />}
                    {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                  </label>
                  <span className="text-[9px] text-slate-600 font-mono">Max 2MB</span>
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* Display Name Field */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                  placeholder={userProfile?.email.split('@')[0]}
                  maxLength={32}
                  className="w-full bg-[#05050a] border border-[#1a1a3a] focus:border-cyan-500/50 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all duration-200 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                />
                <p className="text-[10px] text-slate-600 mt-1.5 font-mono">{editDisplayName.length}/32 characters</p>
              </div>

              {/* Read-only email display */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Email Address <span className="text-slate-600 normal-case font-normal">(read-only)</span>
                </label>
                <div className="w-full bg-[#030308] border border-[#0f0f20] rounded-xl px-4 py-3 text-sm font-mono text-slate-500 flex items-center gap-2">
                  <Mail size={13} className="text-slate-600 shrink-0" />
                  {userProfile?.email}
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* ── PASSWORD CHANGE ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound size={11} className="text-fuchsia-400" />
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Change Password
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="New password (min 8 chars)"
                      className="w-full bg-[#05050a] border border-[#1a1a3a] focus:border-fuchsia-500/50 text-white placeholder-slate-600 rounded-xl px-4 py-3 pr-12 text-sm font-mono outline-none transition-all"
                    />
                    <button onClick={() => setShowNewPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-[#05050a] border border-[#1a1a3a] focus:border-fuchsia-500/50 text-white placeholder-slate-600 rounded-xl px-4 py-3 pr-12 text-sm font-mono outline-none transition-all"
                    />
                    <button onClick={() => setShowConfirmPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={isSavingPw || !newPassword || !confirmPassword}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/25 text-fuchsia-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                  >
                    {isSavingPw ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                    {isSavingPw ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {editError && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[11px] text-red-400 font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  {editError}
                </div>
              )}

              {/* Success message */}
              {editSuccess && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-[11px] text-green-400 font-mono">
                  <CheckCircle2 size={14} className="shrink-0" />
                  Profile updated successfully.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editSaving}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={editSaving || editSuccess}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editSaving ? (
                  <Activity size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    // ── End ROOT wrapper ───────────────────────────────────────────
  );
}

