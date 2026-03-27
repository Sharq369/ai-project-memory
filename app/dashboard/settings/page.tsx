'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Settings, CreditCard, ShieldAlert, Check, Loader2, Zap, Download, Database, Brain, Folder, FileText, BarChart2 } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null)
  const [isNuking, setIsNuking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [planType, setPlanType] = useState<'free' | 'pro' | 'platinum'>('free')
  const [usage, setUsage] = useState({
    projects: 0, projectsLimit: 3,
    memories: 0, memoriesLimit: 20,
    files: 0,
    decomposerToday: 0, decomposerLimit: 2,
    aiToday: 0, aiLimit: 10,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserEmail(user.email || '')

      // FIX 1: Read from profiles.plan_type not subscriptions
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', user.id)
        .single()

      const plan = (profile?.plan_type as 'free' | 'pro' | 'platinum') || 'free'
      setPlanType(plan)

      const limits = {
        free:     { projects: 3,        memories: 20,       decomposer: 2,        ai: 10  },
        pro:      { projects: 20,       memories: 200,      decomposer: 20,       ai: 200 },
        platinum: { projects: Infinity, memories: Infinity, decomposer: Infinity, ai: Infinity },
      }
      const l = limits[plan] || limits.free

      const today = new Date(); today.setHours(0,0,0,0)

      const [
        { count: projectCount },
        { count: memoryCount },
        { count: fileCount },
        { count: decomposerCount },
        { count: aiCount },
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('memories').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('code_memories').select('*', { count: 'exact', head: true }),
        supabase.from('decomposer_log').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today.toISOString()),
        supabase.from('ai_message_log').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today.toISOString()),
      ])

      setUsage({
        projects: projectCount || 0, projectsLimit: l.projects,
        memories: memoryCount || 0,  memoriesLimit: l.memories,
        files: fileCount || 0,
        decomposerToday: decomposerCount || 0, decomposerLimit: l.decomposer,
        aiToday: aiCount || 0, aiLimit: l.ai,
      })

      setLoading(false)
    }
    loadData()
  }, [])

  // FIX 4: Export includes code_memories
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [{ data: projects }, { data: memories }, { data: codeMemories }] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('memories').select('*').eq('user_id', user.id),
        supabase.from('code_memories').select('*'),
      ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: user.email,
        workspace: projects?.map(p => ({
          ...p,
          memories: memories?.filter(m => m.project_id === p.id) || [],
          files: codeMemories?.filter(m => m.project_id === p.id) || [],
        })),
        globalMemories: memories?.filter(m => !m.project_id) || [],
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neural_node_backup_${new Date().getTime()}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export data.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCheckout = async (planId: string, price: number) => {
    setIsCheckingOut(planId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert('Please log in first.')
      const res = await fetch('/api/nowpayments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, price, userId: user.id })
      })
      const data = await res.json()
      if (data.invoiceUrl) window.location.href = data.invoiceUrl
      else alert(data.error || 'Failed to create checkout session')
    } catch { alert('Network error during checkout.') }
    finally { setIsCheckingOut(null) }
  }

  // FIX 2: Hits /api/nuke not /api/enforce?action=nuke
  const handleNukeVault = async () => {
    if (!confirm('WARNING: This will permanently delete ALL your projects, memories and synced files. This cannot be undone.')) return
    setIsNuking(true)
    try {
      const res = await fetch('/api/nuke', { method: 'POST' })
      const data = await res.json()
      if (data.success) { alert('Vault successfully nuked.'); window.location.reload() }
      else alert(data.error || 'Failed to nuke vault.')
    } catch { alert('Network error.') }
    finally { setIsNuking(false) }
  }

  const tabs = [
    { id: 'general',  label: 'General',        icon: Settings    },
    { id: 'billing',  label: 'Billing & Plans', icon: CreditCard  },
    { id: 'danger',   label: 'Danger Zone',     icon: ShieldAlert },
  ]

  // FIX 3: Plan name matches ID — Platinum not Ultra
  const plans = [
    {
      id: 'pro', name: 'Pro', price: 19,
      desc: 'Advanced neural capacity for active developers.',
      features: ['20 Project Nodes','200 Neural Memories','20 Decomposer Runs / Day','200 AI Messages / Day','Full JSON Data Exports','Private Repo Auto-Sync','Memory Editing']
    },
    {
      id: 'platinum', name: 'Platinum', price: 49,
      desc: 'Infinite computational power for power users.',
      features: ['Unlimited Projects, Memories & Files','Unlimited Decomposer & AI Messages','Private Repos + Webhook Auto-Sync','Full Data Export','Priority Support']
    }
  ]

  const formatLimit = (n: number) => n === Infinity ? '∞' : n
  const usagePct = (used: number, limit: number) => limit === Infinity ? 0 : Math.min((used / limit) * 100, 100)
  const planLabel: Record<string, string> = { free: 'Free Tier', pro: 'Pro', platinum: 'Platinum' }

  const usageStats = [
    { label: 'Projects',          used: usage.projects,        limit: usage.projectsLimit,   icon: Folder    },
    { label: 'Memories',          used: usage.memories,        limit: usage.memoriesLimit,   icon: Brain     },
    { label: 'Decomposer Today',  used: usage.decomposerToday, limit: usage.decomposerLimit, icon: Zap       },
    { label: 'AI Messages Today', used: usage.aiToday,         limit: usage.aiLimit,         icon: BarChart2 },
  ]

  if (loading) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto">

        <div className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-blue-500" size={28} />
            <h1 className="text-3xl font-bold tracking-tight italic uppercase">System Preferences</h1>
          </div>
          <p className="text-gray-500 text-sm">Manage your integrations, billing, and global workspace parameters.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-[#0F172A] text-blue-400 border border-[#1E293B]' : 'text-gray-500 hover:bg-[#111] hover:text-gray-300'
                  }`}
                >
                  <Icon size={16} />{tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex-1 space-y-6">

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="p-6 md:p-8 rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-lg">
                  <h2 className="text-lg font-bold mb-1">Workspace Preferences</h2>
                  <p className="text-sm text-gray-500 mb-6">Customize how your app looks and behaves.</p>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-[#111]">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-200">Application Theme</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Currently locked to "Stealth Vibe" (Dark Mode).</p>
                    </div>
                    <span className="px-3 py-1 bg-[#0F172A] border border-[#1E293B] text-blue-500 text-[10px] font-bold tracking-wider rounded-full uppercase">Dark Only</span>
                  </div>
                </div>

                <div className="p-6 md:p-8 rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Database size={18} className="text-gray-400" />
                    <h2 className="text-lg font-bold">Data Export</h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    Download all your projects, memories and synced files as a JSON bundle.
                    {planType === 'free' && <span className="text-yellow-500 ml-1">(Pro+ only)</span>}
                  </p>
                  <button onClick={handleExportData} disabled={isExporting || planType === 'free'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#111] border border-gray-700 hover:border-blue-500 hover:bg-[#0F172A] text-gray-300 hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <Download size={16} />}
                    {isExporting ? 'Packing Memory Bundle...' : 'Export JSON Bundle'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="p-6 md:p-8 rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-lg">
                  <h2 className="text-xl font-bold mb-2">Subscription & Billing</h2>
                  <p className="text-sm text-gray-400 mb-6">Logged in as <span className="text-white font-medium">{userEmail}</span></p>

                  <div className="p-4 border border-blue-900/30 bg-blue-950/10 rounded-xl mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Current Plan</p>
                      <p className="text-lg font-bold text-blue-400">{planLabel[planType]}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">Active</span>
                  </div>

                  {/* FIX 5: Usage stats */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Current Usage</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {usageStats.map(({ label, used, limit, icon: Icon }) => (
                        <div key={label} className="p-4 rounded-xl border border-gray-800 bg-[#111]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className="text-blue-400" />
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                            </div>
                            <span className="text-xs font-mono text-gray-300">{used} / {formatLimit(limit)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${usagePct(used,limit) > 85 ? 'bg-red-500' : usagePct(used,limit) > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                              style={{ width: `${usagePct(used,limit)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((plan) => {
                      const isCurrent = planType === plan.id
                      return (
                        <div key={plan.id} className={`border rounded-2xl p-6 transition-all flex flex-col ${isCurrent ? 'border-blue-500/50 bg-blue-950/10' : 'border-gray-800 bg-[#111] hover:border-blue-500/50'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                              <p className="text-sm text-gray-400 mt-1">{plan.desc}</p>
                            </div>
                            {isCurrent && <span className="text-[10px] font-bold px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full uppercase tracking-wider">Current</span>}
                          </div>
                          <div className="mb-6">
                            <span className="text-3xl font-bold">${plan.price}</span>
                            <span className="text-gray-500 text-sm">/month</span>
                          </div>
                          <ul className="space-y-3 mb-8 flex-1">
                            {plan.features.map((feat, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                <Check size={16} className="text-blue-500 flex-shrink-0" /> {feat}
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => handleCheckout(plan.id, plan.price)} disabled={isCheckingOut === plan.id || isCurrent}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isCheckingOut === plan.id ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
                              : isCurrent ? 'Current Plan'
                              : <><Zap size={18} /> Upgrade to {plan.name}</>}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="p-6 md:p-8 rounded-2xl border border-red-900/30 bg-[#1a0505] shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldAlert className="text-red-500" size={24} />
                  <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                </div>
                <p className="text-sm text-red-400/70 mb-6">Proceed with extreme caution. Actions here are irreversible.</p>
                <div className="p-4 border border-red-900/50 bg-black/50 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-200">Nuke Entire Vault</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Permanently deletes all {usage.projects} projects, {usage.memories} memories and {usage.files} synced files.
                    </p>
                  </div>
                  <button onClick={handleNukeVault} disabled={isNuking}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isNuking ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                    {isNuking ? 'Nuking Vault...' : 'Nuke Vault'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
