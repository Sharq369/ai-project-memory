'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Settings, CreditCard, ShieldAlert, Check, Loader2, Zap, Download, Database } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null)
  const [isNuking, setIsNuking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [subscription, setSubscription] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single()
        if (sub) setSubscription(sub)
      }
      setLoading(false)
    }
    loadUser()
  }, [supabase])

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: projects } = await supabase.from('projects').select('*').eq('user_id', user.id)
      const { data: memories } = await supabase.from('code_memories').select('*')

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: user.email,
        workspace: projects?.map(p => ({
          ...p,
          files: memories?.filter(m => m.project_id === p.id) || []
        }))
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neural_node_backup_${new Date().getTime()}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export data.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleCheckout = async (planName: string, price: number) => {
    setIsCheckingOut(planName)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert("Please log in first.")

      const res = await fetch('/api/nowpayments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName, price, userId: user.id })
      })
      const data = await res.json()
      
      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl
      } else {
        alert(data.error || "Failed to create checkout session")
      }
    } catch (error) {
      console.error(error)
      alert("Network error during checkout.")
    } finally {
      setIsCheckingOut(null)
    }
  }

  const handleNukeVault = async () => {
    if (!confirm("WARNING: This will permanently delete all your projects and memories. Are you absolutely sure?")) return
    
    setIsNuking(true)
    try {
      const res = await fetch('/api/enforce?action=nuke', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert("Vault successfully nuked.")
        window.location.reload()
      } else {
        alert(data.error || "Failed to nuke vault.")
      }
    } catch (error) {
      alert("Network error.")
    } finally {
      setIsNuking(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
  ]

  // NEW DRAFTED PLANS
  const plans = [
    { 
      name: 'Pro', 
      price: 15, 
      desc: 'Advanced neural capacity for professionals.', 
      features: [
        'Unlimited Project Nodes', 
        'AI PRD Decomposer (GPT-4o)', 
        'Full JSON Data Exports',
        'Priority Memory Sync'
      ] 
    },
    { 
      name: 'Ultra', 
      price: 40, 
      desc: 'Maximum computational power for power users.', 
      features: [
        'Everything in Pro', 
        'Unlimited Serverless AI Tasks', 
        'Custom AI Model Routing', 
        '24/7 Priority Support'
      ] 
    }
  ]

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-blue-500" size={28} />
            <h1 className="text-3xl font-bold tracking-tight italic uppercase">System Preferences</h1>
          </div>
          <p className="text-gray-500 text-sm">Manage your integrations, billing, and global workspace parameters.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* SIDEBAR TABS */}
          <div className="w-full md:w-64 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-[#0F172A] text-blue-400 border border-[#1E293B]' 
                      : 'text-gray-500 hover:bg-[#111] hover:text-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 space-y-6">
            
            {/* GENERAL TAB */}
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
                    <span className="px-3 py-1 bg-[#0F172A] border border-[#1E293B] text-blue-500 text-[10px] font-bold tracking-wider rounded-full uppercase">
                      Dark Only
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8 rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Database size={18} className="text-gray-400" />
                    <h2 className="text-lg font-bold">Data Export</h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">Download a copy of all your code memories and neural nodes as a JSON file.</p>
                  
                  <button 
                    onClick={handleExportData} 
                    disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#111] border border-gray-700 hover:border-blue-500 hover:bg-[#0F172A] text-gray-300 hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <Download size={16} />}
                    {isExporting ? 'Packing Memory Bundle...' : 'Export JSON Bundle'}
                  </button>
                </div>
              </div>
            )}

            {/* BILLING TAB */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="p-6 md:p-8 rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-lg">
                  <h2 className="text-xl font-bold mb-2">Subscription & Billing</h2>
                  <p className="text-sm text-gray-400 mb-6">Currently logged in as <span className="text-white font-medium">{userEmail}</span></p>
                  
                  <div className="p-4 border border-blue-900/30 bg-blue-950/10 rounded-xl mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Current Plan</p>
                      <p className="text-lg font-bold text-blue-400">{subscription ? subscription.plan_name : 'Free Tier'}</p>
                    </div>
                    {subscription?.status === 'active' && (
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">Active</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((plan) => (
                      <div key={plan.name} className="border border-gray-800 bg-[#111] rounded-2xl p-6 hover:border-blue-500/50 transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <p className="text-sm text-gray-400 mt-1">{plan.desc}</p>
                          </div>
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
                        <button 
                          onClick={() => handleCheckout(plan.name, plan.price)}
                          disabled={isCheckingOut === plan.name}
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isCheckingOut === plan.name ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                          {isCheckingOut === plan.name ? 'Processing...' : `Upgrade to ${plan.name}`}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DANGER ZONE TAB */}
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
                    <p className="text-xs text-gray-500 mt-1">Permanently delete all projects, code memories, and settings.</p>
                  </div>
                  <button 
                    onClick={handleNukeVault}
                    disabled={isNuking}
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
