'use client'

// app/admin/page.tsx
// Admin panel — only accessible by DEVELOPER_IDS.
// Shows: platform stats, user table with plan management, usage analytics.

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import {
  Users, Brain, Folder, FileText, Zap, Activity,
  Crown, Shield, Search, ChevronUp, ChevronDown,
  RefreshCw, Loader2, AlertCircle, BarChart2,
  TrendingUp, User, Check, X, MessageSquare, Arrowleft
} from 'lucide-react'

const ADMIN_IDS = ['33157b98-fdd0-4e04-b14b-bee4352f80c7']

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro' | 'platinum'
  created_at: string
  last_sign_in: string | null
  projects: number
  memories: number
  files: number
  ai_today: number
  decomp_today: number
}

interface Stats {
  total_users: number
  free_users: number
  pro_users: number
  platinum_users: number
  total_projects: number
  total_memories: number
  total_files: number
  ai_calls_today: number
  decomp_today: number
  new_memories_30d: number
  new_projects_30d: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (iso: string | null) => {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

const PLAN_STYLES = {
  free:     'bg-gray-500/15 text-gray-400 border-gray-500/25',
  pro:      'bg-blue-500/15 text-blue-400 border-blue-500/25',
  platinum: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/25',
}

const PLAN_ICON = {
  free: <User size={10} />,
  pro: <Zap size={10} />,
  platinum: <Crown size={10} />,
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: number | string; sub?: string; color: string
}) => (
  <div className="bg-[#0b0b16]/80 border border-[#1a1a3a] rounded-xl p-5">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      <Icon size={18} />
    </div>
    <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
  </div>
)

// ── Plan Badge with inline editor ─────────────────────────────────────────────
function PlanBadge({ user, onUpdate }: { user: AdminUser; onUpdate: (id: string, plan: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const changePlan = async (newPlan: string) => {
    if (newPlan === user.plan) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan: newPlan })
      })
      if (res.ok) onUpdate(user.id, newPlan)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  if (editing) return (
    <div className="flex items-center gap-1">
      {(['free', 'pro', 'platinum'] as const).map(p => (
        <button
          key={p}
          onClick={() => changePlan(p)}
          disabled={saving}
          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${
            p === user.plan ? 'opacity-40 cursor-default' : 'hover:scale-105'
          } ${PLAN_STYLES[p]}`}
        >
          {saving ? <Loader2 size={9} className="animate-spin" /> : p}
        </button>
      ))}
      <button onClick={() => setEditing(false)} className="text-slate-600 hover:text-white ml-1">
        <X size={12} />
      </button>
    </div>
  )

  return (
    <button
      onClick={() => setEditing(true)}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border transition-all hover:scale-105 ${PLAN_STYLES[user.plan]}`}
      title="Click to change plan"
    >
      {PLAN_ICON[user.plan]} {user.plan}
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<keyof AdminUser>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'platinum'>('all')
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !ADMIN_IDS.includes(user.id)) {
        router.push('/dashboard')
        return
      }

      const res = await fetch('/api/admin')
      if (!res.ok) throw new Error('Failed to fetch admin data')
      const data = await res.json()
      setUsers(data.users || [])
      setStats(data.stats || null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router, supabase.auth])

  useEffect(() => { fetchData() }, [fetchData])

  const handlePlanUpdate = (id: string, plan: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, plan: plan as any } : u))
  }

  const toggleSort = (col: keyof AdminUser) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const filtered = users
    .filter(u =>
      (planFilter === 'all' || u.plan === planFilter) &&
      (u.email.toLowerCase().includes(search.toLowerCase()) ||
       (u.display_name || '').toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const av = a[sortBy] ?? 0
      const bv = b[sortBy] ?? 0
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

  const SortIcon = ({ col }: { col: keyof AdminUser }) => (
    sortBy === col
      ? sortDir === 'asc' ? <ChevronUp size={11} className="text-blue-400" /> : <ChevronDown size={11} className="text-blue-400" />
      : <ChevronDown size={11} className="text-slate-700" />
  )

  if (loading) return (
    <div className="min-h-screen bg-[#030308] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Activity size={32} className="text-fuchsia-500 animate-pulse" />
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Loading Admin Panel...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#030308] flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#030308] text-slate-200 font-sans">

      {/* Ambient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(217,70,239,0.03),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.03),transparent_40%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">

        {/* ── NEW: BACK TO NEXUS BUTTON ── */}
        <button 
          onClick={() => router.push('/dashboard')}
          className="group flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-6 text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          Return to Nexus
        </button>

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1 bg-gradient-to-b from-fuchsia-400 to-cyan-600 shadow-[0_0_15px_#d946ef]" />
            <div>
              <p className="text-[9px] text-fuchsia-400 font-bold uppercase tracking-[0.2em] mb-0.5">Memory AI</p>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Admin Command</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl">
              <Shield size={13} className="text-fuchsia-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">Super Admin</span>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <RefreshCw size={15} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Platform Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Users}       label="Total Users"      value={stats.total_users}       color="bg-blue-500/15 text-blue-400" />
            <StatCard icon={User}        label="Free"             value={stats.free_users}        color="bg-gray-500/15 text-gray-400" />
            <StatCard icon={Zap}         label="Pro"              value={stats.pro_users}         color="bg-blue-500/15 text-blue-400" />
            <StatCard icon={Crown}       label="Platinum"         value={stats.platinum_users}    color="bg-fuchsia-500/15 text-fuchsia-400" />
            <StatCard icon={Folder}      label="Projects"         value={stats.total_projects}    color="bg-cyan-500/15 text-cyan-400" />
            <StatCard icon={Brain}       label="Memories"         value={stats.total_memories}    color="bg-emerald-500/15 text-emerald-400" />
            <StatCard icon={FileText}    label="Synced Files"     value={stats.total_files}       color="bg-violet-500/15 text-violet-400" />
            <StatCard icon={MessageSquare} label="AI Calls Today" value={stats.ai_calls_today}   color="bg-amber-500/15 text-amber-400" />
            <StatCard icon={BarChart2}   label="Decomposer Today" value={stats.decomp_today}      color="bg-rose-500/15 text-rose-400" />
            <StatCard icon={TrendingUp}  label="New Memories 30d" value={stats.new_memories_30d}  color="bg-teal-500/15 text-teal-400" />
            <StatCard icon={Activity}    label="New Projects 30d" value={stats.new_projects_30d}  color="bg-indigo-500/15 text-indigo-400" />
          </div>
        )}

        {/* User Table */}
        <div className="bg-[#0b0b16]/80 border border-[#1a1a3a] rounded-2xl overflow-hidden">

          {/* Table header controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
            <h2 className="text-[11px] uppercase font-black tracking-widest text-white flex items-center gap-2">
              <Users size={14} className="text-fuchsia-400" /> Users ({filtered.length})
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <Search size={13} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search email or name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-full"
                />
              </div>
              {/* Plan filter */}
              <div className="flex gap-1">
                {(['all', 'free', 'pro', 'platinum'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPlanFilter(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                      planFilter === p
                        ? 'bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    { label: 'User',        col: 'email'       as keyof AdminUser },
                    { label: 'Plan',        col: 'plan'        as keyof AdminUser },
                    { label: 'Joined',      col: 'created_at'  as keyof AdminUser },
                    { label: 'Last Active', col: 'last_sign_in' as keyof AdminUser },
                    { label: 'Projects',   col: 'projects'    as keyof AdminUser },
                    { label: 'Memories',   col: 'memories'    as keyof AdminUser },
                    { label: 'Files',      col: 'files'       as keyof AdminUser },
                    { label: 'AI Today',   col: 'ai_today'    as keyof AdminUser },
                    { label: 'Decomp',     col: 'decomp_today' as keyof AdminUser },
                  ].map(({ label, col }) => (
                    <th
                      key={col}
                      onClick={() => toggleSort(col)}
                      className="px-4 py-3 text-[9px] uppercase font-black tracking-widest text-slate-500 cursor-pointer hover:text-slate-300 transition-colors select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {label} <SortIcon col={col} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-600 text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">

                      {/* User */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1a3a] to-[#0b0b16] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatar_url
                              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <User size={14} className="text-slate-500" />
                            }
                          </div>
                          <div className="overflow-hidden">
                            {user.display_name && (
                              <p className="text-[11px] font-bold text-white truncate">{user.display_name}</p>
                            )}
                            <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan — inline editable */}
                      <td className="px-4 py-3">
                        <PlanBadge user={user} onUpdate={handlePlanUpdate} />
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        {timeAgo(user.created_at)}
                      </td>

                      {/* Last active */}
                      <td className="px-4 py-3 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        {timeAgo(user.last_sign_in)}
                      </td>

                      {/* Usage numbers */}
                      {[user.projects, user.memories, user.files].map((val, i) => (
                        <td key={i} className="px-4 py-3 text-[11px] font-bold text-slate-300 text-center">
                          {val > 0 ? val : <span className="text-slate-700">—</span>}
                        </td>
                      ))}

                      {/* Today's usage */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[11px] font-bold ${user.ai_today > 0 ? 'text-amber-400' : 'text-slate-700'}`}>
                          {user.ai_today || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[11px] font-bold ${user.decomp_today > 0 ? 'text-rose-400' : 'text-slate-700'}`}>
                          {user.decomp_today || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
