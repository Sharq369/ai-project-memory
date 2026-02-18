'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { syncGitHubRepo } from '../../../lib/github' // Ensure this file exists in your lib folder
import { Folder, Plus, Loader2, X, Github, Database } from 'lucide-react'

// 1. RE-ADD THE MODAL COMPONENT
function SyncModal({ isOpen, onClose, onSync, isSyncing }: any) {
  const [url, setUrl] = useState('')
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Neural Sync</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-6">Enter GitHub Repository URL</p>
        <input 
          className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl px-6 py-4 text-white mb-8 outline-none focus:border-blue-500 transition-all font-mono text-xs" 
          placeholder="https://github.com/username/repo" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
        />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-gray-800 rounded-xl text-gray-500 hover:bg-gray-800 transition-all">Cancel</button>
          <button 
            onClick={() => onSync(url)} 
            disabled={isSyncing || !url} 
            className="flex-[2] py-4 text-[10px] font-black uppercase tracking-widest bg-blue-600 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 transition-all disabled:opacity-30"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : 'Establish Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [dailyCount, setDailyCount] = useState(0)
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSyncing, setIsSyncing] = useState<string | null>(null) // TRACKS SYNC STATE
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
    if (dailyCount >= 3 || !newProject) return
    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('projects').insert([{ name: newProject, user_id: user?.id }])
    setNewProject(''); fetchProjects(); setIsCreating(false);
  }

  // 2. RE-ADD THE SYNC LOGIC
  const handleSync = async (url: string) => {
    if (!activeProjectId) return
    setIsSyncing(activeProjectId)
    const res = await syncGitHubRepo(url, activeProjectId)
    if (res.success) { 
      setModalOpen(false)
      fetchProjects() 
    } else { 
      alert(`Sync Failed: ${res.error}`) 
    }
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
          <input className="flex-1 md:w-64 bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-all" placeholder="New Node..." value={newProject} onChange={(e) => setNewProject(e.target.value)} />
          <button className="bg-blue-600 p-4 rounded-xl shadow-lg shadow-blue-900/20 hover:scale-105 transition-transform"><Plus size={20} /></button>
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
              <button 
                onClick={() => { setActiveProjectId(p.id); setModalOpen(true); }} // TRIGGER MODAL
                className="bg-[#0f1117] border border-gray-800 py-3 rounded-2xl text-[9px] font-black uppercase text-gray-500 hover:text-white transition-all"
              >
                Sync
              </button>
              <Link href={`/dashboard/projects/${p.id}/doc`} className="bg-blue-600/10 border border-blue-500/20 py-3 rounded-2xl text-[9px] font-black uppercase text-blue-400 text-center hover:bg-blue-600 hover:text-white transition-all">Docs</Link>
            </div>
          </div>
        ))}
      </div>

      {/* 3. INJECT THE MODAL INTO THE PAGE */}
      <SyncModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSync={handleSync} 
        isSyncing={!!isSyncing} 
      />
    </div>
  )
}
