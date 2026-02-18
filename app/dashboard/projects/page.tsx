'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { syncGitHubRepo } from '../../../lib/github'
import { Folder, Plus, Loader2, Github, BookOpen, X } from 'lucide-react'

// COMPLETE SYNC MODAL COMPONENT
function SyncModal({ isOpen, onClose, onSync, isSyncing }: any) {
  const [url, setUrl] = useState('')
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Sync GitHub Repository</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <input 
          className="w-full bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 text-white mb-6 outline-none focus:border-blue-500" 
          placeholder="https://github.com/user/repo" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-[10px] font-bold uppercase border border-gray-800 rounded-xl text-gray-400">Cancel</button>
          <button onClick={() => onSync(url)} disabled={isSyncing || !url} className="flex-[2] py-3 text-[10px] font-bold uppercase bg-blue-600 rounded-xl flex items-center justify-center gap-2">
            {isSyncing ? <Loader2 className="animate-spin" size={14} /> : 'Start Sync'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select(`*, memories:memories(count)`).order('created_at', { ascending: false })
    if (data) setProjects(data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject || projects.length >= 3) return
    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('projects').insert([{ name: newProject, user_id: user?.id }])
    setNewProject(''); fetchProjects(); setIsCreating(false);
  }

  const handleSync = async (url: string) => {
    if (!activeProjectId) return
    setIsSyncing(activeProjectId)
    const res = await syncGitHubRepo(url, activeProjectId)
    if (res.success) { setModalOpen(false); fetchProjects(); } else { alert(res.error) }
    setIsSyncing(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex justify-between items-center bg-[#16181e] p-8 rounded-[2rem] border border-gray-800/50">
        <h1 className="text-2xl font-bold italic uppercase">Project Vault</h1>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input className="bg-[#0f1117] border border-gray-800 text-white px-4 py-2 rounded-xl text-sm" placeholder="New Project..." value={newProject} onChange={(e) => setNewProject(e.target.value)} />
          <button className="bg-blue-600 p-2 rounded-xl">{isCreating ? <Loader2 className="animate-spin" /> : <Plus />}</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="bg-[#16181e] border border-gray-800 p-8 rounded-[2rem]">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Folder /></div>
              <div className="text-right text-[10px] font-bold text-gray-500 uppercase">Blocks: {p.memories?.[0]?.count || 0}</div>
            </div>
            <h3 className="text-lg font-bold mb-8">{p.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setActiveProjectId(p.id); setModalOpen(true); }} // THIS OPENS THE MODAL
                className="bg-[#0f1117] border border-gray-800 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white"
              >
                Sync
              </button>
              <Link href={`/dashboard/projects/${p.id}/doc`} className="bg-blue-600/10 border border-blue-500/20 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest text-blue-400 text-center">Docs</Link>
            </div>
          </div>
        ))}
      </div>
      <SyncModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSync={handleSync} isSyncing={!!isSyncing} />
    </div>
  )
}
