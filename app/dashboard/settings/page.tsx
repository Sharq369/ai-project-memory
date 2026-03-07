'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Check, Settings, Github, CreditCard, AlertTriangle, 
  Download, Key, Palette, HardDrive, Loader2, CheckCircle2, AlertCircle, Info, X, ShieldAlert
} from 'lucide-react'

// Your existing plans, untouched
const plans = [
  { name: 'Free', price: '$0', features: ['3 Project Limit', 'Basic AI Sync'], current: true, highlight: false },
  { name: 'Premium', price: '$19', features: ['Unlimited Projects', 'Deep Analysis'], current: false, highlight: true },
  { name: 'Platinum', price: '$49', features: ['Team Access', 'API Access'], current: false, highlight: false }
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'billing' | 'danger'>('integrations')
  
  // States for interactive elements
  const [githubToken, setGithubToken] = useState('')
  const [isSavingToken, setIsSavingToken] = useState(false)
  const [notification, setNotification] = useState<{ visible: boolean, type: 'success' | 'error' | 'info', message: string }>({ visible: false, type: 'info', message: '' })

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ visible: true, type, message })
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 4000)
  }

  const handleSaveToken = () => {
    if (!githubToken.trim()) return
    setIsSavingToken(true)
    // Simulate API call to save securely to Supabase
    setTimeout(() => {
      setIsSavingToken(false)
      showToast('success', 'GitHub Personal Access Token securely stored.')
    }, 1200)
  }

  const handleExport = () => {
    showToast('info', 'Compiling knowledge base... Your download will begin shortly.')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      
      {/* PREMIUM TOAST NOTIFICATION */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none
        ${notification.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}
      >
        <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-md pointer-events-auto
          ${notification.type === 'success' ? 'bg-green-950/80 border-green-500/30 text-green-200' :
            notification.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-200' :
            'bg-blue-950/80 border-blue-500/30 text-blue-200'}`}
        >
          {notification.type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
          {notification.type === 'error' && <AlertCircle size={16} className="text-red-500" />}
          {notification.type === 'info' && <Info size={16} className="text-blue-500" />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(prev => ({...prev, visible: false}))} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 border-b border-gray-800 pb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            <Settings className="text-blue-500" size={32} />
            System Preferences
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Manage your integrations, billing, and global workspace parameters.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* SIDEBAR NAVIGATION */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'}`}
            >
              <Palette size={16} /> General
            </button>
            <button 
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'integrations' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'}`}
            >
              <Github size={16} /> Integrations
            </button>
            <button 
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'billing' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'}`}
            >
              <CreditCard size={16} /> Neural Capacity
            </button>
            <button 
              onClick={() => setActiveTab('danger')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent'}`}
            >
              <ShieldAlert size={16} /> Danger Zone
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 min-w-0">
            
            {/* INTEGRATIONS TAB */}
            {activeTab === 'integrations' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-white/5 rounded-xl border border-gray-700">
                      <Github size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">GitHub Access Token</h2>
                      <p className="text-sm text-gray-500">Required to sync private repositories to your Neural Nodes.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                      <input 
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-all font-mono placeholder:text-gray-700"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Generate a token in GitHub →</a>
                      <button 
                        onClick={handleSaveToken}
                        disabled={isSavingToken || !githubToken}
                        className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSavingToken ? <Loader2 size={14} className="animate-spin" /> : 'Save Key'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BILLING TAB (Your original code beautifully integrated) */}
            {activeTab === 'billing' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Upgrade Neural Capacity</h2>
                  <p className="text-sm text-gray-500 mb-8">Unlock unlimited projects, deeper context windows, and advanced AI models.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                      <div key={plan.name} className={`bg-[#111111] border ${plan.highlight ? 'border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'border-gray-800'} rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-blue-500/50 transition-all`}>
                        {plan.highlight && <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>}
                        
                        <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                        <div className="mb-6">
                          <span className="text-3xl font-black text-white">{plan.price}</span>
                          <span className="text-gray-500 text-[10px] uppercase ml-1">/mo</span>
                        </div>
                        
                        <ul className="space-y-3 mb-8 flex-1">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                              <Check size={14} className="text-blue-500" /> {f}
                            </li>
                          ))}
                        </ul>
                        
                        <Link 
                          href={plan.current ? '#' : `/dashboard/checkout/${plan.name.toLowerCase()}`} 
                          className={`w-full py-3 rounded-xl font-black text-[10px] text-center uppercase tracking-widest transition-all ${plan.current ? 'bg-[#16181e] text-gray-500 cursor-default' : plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white text-black hover:bg-gray-200'}`}
                        >
                          {plan.current ? 'Active Plan' : 'Select Plan'}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-2">Workspace Preferences</h2>
                  <p className="text-sm text-gray-500 mb-8">Customize how your app looks and behaves.</p>
                  
                  <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-gray-800">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Application Theme</h4>
                      <p className="text-xs text-gray-500">Currently locked to "Stealth Vibe" (Dark Mode).</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Dark Only
                    </div>
                  </div>
                </div>

                <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <HardDrive size={20} className="text-white" />
                    <h2 className="text-xl font-bold text-white">Data Export</h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">Download a copy of all your code memories and neural nodes as a JSON file.</p>
                  
                  <button 
                    onClick={handleExport}
                    className="px-5 py-2.5 bg-[#16181e] border border-gray-700 hover:border-gray-500 text-gray-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <Download size={16} /> Export JSON Bundle
                  </button>
                </div>
              </div>
            )}

            {/* DANGER ZONE TAB */}
            {activeTab === 'danger' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-red-500/5 border border-red-900/30 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    <h2 className="text-xl font-bold text-red-500">Purge Data</h2>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">
                    Permanently delete all neural nodes, memory blocks, and cached code from your vault. This action cannot be undone.
                  </p>
                  
                  <button 
                    onClick={() => showToast('error', 'Authentication required to purge vault.')}
                    className="px-6 py-3 bg-red-600/10 border border-red-600/30 hover:bg-red-600 hover:text-white text-red-500 rounded-xl text-sm font-bold transition-all"
                  >
                    Nuke Vault
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
