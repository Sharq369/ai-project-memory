'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { syncGitHubRepo } from '../../../lib/github'
import { 
  Folder, Plus, Loader2, Calendar, 
  Trash2, Github, BookOpen, X, 
  Crown, Zap, Check, AlertCircle 
} from 'lucide-react'

/* --- UI COMPONENT: SYNC MODAL --- */
function SyncModal({ isOpen, onClose, onSync, isSyncing }: any) {
  const [url, setUrl] = useState('')
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3 text-white">
            <Github size={24} className="text-blue-500" /> 
            <h3 className="text-xl font-bold tracking-tight">Sync Repository</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <p className="text-gray-400 text-xs mb-4 leading-relaxed">Enter a public GitHub URL to ingest source code into this project's AI memory.</p>
        <input 
          autoFocus 
          className="w-full bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-4 text-white outline-none focus:border-blue-500 mb-6 transition-all" 
          placeholder="https://github.com/user/repo" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-gray-800 text-gray-400 font-bold text-[10px] uppercase tracking-widest">Cancel</button>
          <button 
            onClick={() => onSync(url)} 
            disabled={isSyncing || !url} 
            className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : 'Begin Analysis'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* --- MAIN PAGE COMPONENT --- */
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  
  // Monetization State
  const [userPlan, setUserPlan] = useState('Free') 
  const projectLimit = userPlan === 'Free' ? 3 : Infinity

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select(`*, memories:memories(count)`)
      .order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.trim() || isCreating) return
    
    // Check Plan Limits
    if (projects.length >= projectLimit) {
      alert(`Limit Reached: ${userPlan} Tier is restricted to ${projectLimit} projects. Upgrade to Premium for unlimited access.`)
      return
    }

    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: newProject, user_id: user?.id, status: 'active' }])
      .select()
    
    if (!error && data) { 
      setProjects([{ ...data[0], memories: [{ count: 0 }] }, ...projects])
      setNewProject('') 
    }
    setIsCreating(false)
  }

  const handleSyncAction = async (url: string) => {
    if (!activeProjectId) return
    setIsSyncing(activeProjectId)
    const result = await syncGitHubRepo(url, activeProjectId)
    if (result.success) { 
      setModalOpen(false)
      fetchProjects() 
    } else { 
      alert("Sync Failed: " + result.error) 
    }
    setIsSyncing(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-6 pb-20">
      
      {/* Monetization Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#16181e] p-8 rounded-[2rem] border border-gray-800/50 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tighter">Project Vault</h1>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
              {userPlan} Tier
            </span>
          </div>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">
            {projects.length} / {projectLimit === Infinity ? '∞' : projectLimit} Nodes Occupied
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex w-full md:w-auto gap-2">
          <input 
            className="flex-1 md:w-64 bg-[#0f1117] border border-gray-800 text-white px-5 py-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" 
            placeholder="New Project Name..." 
            value={newProject} 
            onChange={(e) => setNewProject(e.target.value)} 
          />
          <button 
            disabled={isCreating || !newProject} 
            className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
          </button>
        </form>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="group bg-[#16181e] border border-gray-800 p-8 rounded-[2rem] hover:border-blue-500/30 transition-all duration-500 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform duration-500">
                <Folder size={24} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Memory Blocks</p>
                <p className="text-xl font-black text-white">{project.memories?.[0]?.count || 0}</p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-8 tracking-tight group-hover:text-blue-400 transition-colors">{project.name}</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setActiveProjectId(project.id); setModalOpen(true); }} 
                className="bg-[#0f1117] border border-gray-800 py-4 rounded-2xl text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2 hover:border-white hover:text-white transition-all"
              >
                <Github size={14} /> Sync
              </button>
              <Link 
                href={`/dashboard/projects/${project.id}/doc`} 
                className="bg-blue-600/10 border border-blue-500/20 py-4 rounded-2xl text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
              >
                <BookOpen size={14} /> Docs
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* --- PLANS SECTION (MONETIZATION) --- */}
      <div className="pt-20 border-t border-gray-800/50">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Upgrade Neural Capacity</h2>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Select a tier to expand your AI memory</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Free', price: '$0', icon: <Zap size={20}/>, features: ['3 Project Limit', 'Basic AI Sync', 'Community Support'] },
            { name: 'Premium', price: '$19', icon: <Crown size={20}/>, features: ['Unlimited Projects', 'Deep Repo Analysis', 'Priority Queue', 'Custom Tags'], highlight: true },
            { name: 'Platinum', price: '$49', icon: <AlertCircle size={20}/>, features: ['Full Team Access', 'Private LLM Nodes', '24/7 Concierge', 'API Access'] }
          ].map((plan) => (
            <div key={plan.name} className={`bg-[#16181e] border ${plan.highlight ? 'border-blue-500' : 'border-gray-800'} p-8 rounded-[2rem] flex flex-col relative overflow-hidden`}>
              {plan.highlight && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">Popular</div>}
              <div className="flex items-center gap-3 mb-4 text-white">
                <div className={`${plan.highlight ? 'text-blue-500' : 'text-gray-500'}`}>{plan.icon}</div>
                <h4 className="font-bold uppercase tracking-widest text-xs">{plan.name}</h4>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-gray-500 text-[10px] font-bold uppercase ml-2">/ month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <Check size={14} className="text-blue-500" /> {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-800 text-gray-400 hover:bg-white hover:text-black'}`}>
                {plan.name === userPlan ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <SyncModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSync={handleSyncAction} 
        isSyncing={!!isSyncing} 
      />
    </div>
  )
}
