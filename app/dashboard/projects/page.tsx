'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { syncRepo } from '../../../lib/github' 
import { Folder, Plus, Loader2, X, Github, Gitlab, Database, Box } from 'lucide-react'

// ─── UNIVERSAL SYNC MODAL ──────────────────────────────────────────────────
function SyncModal({ isOpen, onClose, onSync, isSyncing }: any) {
  const [url, setUrl] = useState('')
  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Neural Sync</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <button 
            onClick={() => setProvider('github')}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${provider === 'github' ? 'bg-white text-black border-white' : 'bg-[#0f1117] border-gray-800 text-gray-500 hover:border-gray-600'}`}
          >
            <Github size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">GitHub</span>
          </button>
          
          <button 
            onClick={() => setProvider('gitlab')}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${provider === 'gitlab' ? 'bg-[#FC6D26] text-white border-[#FC6D26]' : 'bg-[#0f1117] border-gray-800 text-gray-500 hover:border-gray-600'}`}
          >
            <Gitlab size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">GitLab</span>
          </button>

          <button 
            onClick={() => setProvider('bitbucket')}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${provider === 'bitbucket' ? 'bg-[#2684FF] text-white border-[#2684FF]' : 'bg-[#0f1117] border-gray-800 text-gray-500 hover:border-gray-600'}`}
          >
            <Box size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Bitbucket</span>
          </button>
        </div>

        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-4">Target Repository URL</p>
        <input 
          className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl px-6 py-4 text-white mb-8 outline-none focus:border-blue-500 transition-all font-mono text-xs" 
          placeholder={`https://${provider}.com/username/repo`}
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
        />
        
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-gray-800 rounded-xl text-gray-500">Cancel</button>
          <button 
            onClick={() => onSync(url, provider)} 
            disabled={isSyncing || !url} 
            className="flex-[2] py-4 text-[10px] font-black uppercase tracking-widest bg-blue-600 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : `Establish Link`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [dailyCount, setDailyCount] = useState(0)
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('projects').select(`*, memories:memories(count)`).order('created_at', { ascending: false })
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user?.id).gte('created_at', today)
    if (data) setProjects(data)
    if (count !== null) setDailyCount(count)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dailyCount >= 3) return alert("Daily Quota Reached.")
    if (!newProject) return
    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('projects').insert([{ name: newProject, user_id: user?.id }])
    setNewProject(''); fetchProjects(); setIsCreating(false);
  }

  // THIS IS THE UPDATED CALL
  const handleSync = async (url: string, provider: 'github' | 'gitlab' | 'bitbucket') => {
    if (!activeProjectId) return
    setIsSyncing(activeProjectId)
    const res = await syncRepo(url, activeProjectId, provider) 
    if (res.success) { setModalOpen(false); fetchProjects(); } 
    else { alert(`Sync Failed: ${res.error}`); }
    setIsSyncing(null)
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-6">
      <div className="bg-[#16181e] border border-gray-800 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">Daily Usage: {dailyCount} / 3 Nodes</p>
        </div>
        <form onSubmit={handleCreate} className="flex gap-2 w-full md:w-auto">
          <input className="flex-1 md:w-64 bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl text-xs outline-none focus:border-blue-500" placeholder="New Node..." value={newProject} onChange={(e) => setNewProject(e.target.value)} />
          <button className="bg-blue-600 p-4 rounded-xl shadow-lg hover:scale-105 transition-transform"><Plus size={20} /></button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="bg-[#16181e] border border-gray-800 p-8 rounded-[2.5rem] hover:border-blue-500/40 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500"><Folder size={24} /></div>
              <div className="text-right"><p className="text-[9px] font-black text-gray-600 uppercase">Blocks</p><p className="text-xl font-black text-white">{p.memories?.[0]?.count || 0}</p></div>
            </div>
            <h3 className="text-lg font-bold text-white mb-8 italic uppercase tracking-tight">{p.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setActiveProjectId(p.id); setModalOpen(true); }} className="bg-[#0f1117] border border-gray-800 py-3 rounded-2xl text-[9px] font-black uppercase text-gray-500 hover:text-white transition-all">Sync</button>
              <Link href={`/dashboard/projects/${p.id}/doc`} className="bg-blue-600/10 border border-blue-500/20 py-3 rounded-2xl text-[9px] font-black uppercase text-blue-400 text-center hover:bg-blue-600 hover:text-white transition-all">Docs</Link>
            </div>
          </div>
        ))}
      </div>

      <SyncModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSync={handleSync} isSyncing={!!isSyncing} />
    </div>
  )
}
