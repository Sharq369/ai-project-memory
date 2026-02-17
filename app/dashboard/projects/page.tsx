'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { syncGitHubRepo } from '../../../lib/github'
import { Folder, Plus, Loader2, Calendar, Trash2, Layers, Github, RefreshCw, BookOpen, X } from 'lucide-react'

function SyncModal({ isOpen, onClose, onSync, isSyncing }: any) {
  const [url, setUrl] = useState('')
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3 text-white"><Github size={24} /> <h3 className="text-xl font-bold">Sync Repository</h3></div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <input autoFocus className="w-full bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 mb-4" placeholder="GitHub URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-800 text-gray-400 font-bold text-[10px] uppercase">Cancel</button>
          <button onClick={() => onSync(url)} disabled={isSyncing || !url} className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : 'Begin Analysis'}
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
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select(`*, memories:memories(count)`).order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.trim() || isCreating) return
    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('projects').insert([{ name: newProject, user_id: user?.id, status: 'active' }]).select()
    if (!error && data) { setProjects([{ ...data[0], memories: [{ count: 0 }] }, ...projects]); setNewProject('') }
    setIsCreating(false)
  }

  const handleSyncAction = async (url: string) => {
    if (!activeProjectId) return
    setIsSyncing(activeProjectId)
    const result = await syncGitHubRepo(url, activeProjectId)
    if (result.success) { setModalOpen(false); fetchProjects(); } else { alert("Sync Failed: " + result.error) }
    setIsSyncing(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#16181e] p-8 rounded-3xl border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-2">Project Vault</h1>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input className="bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 w-64" placeholder="Project Name..." value={newProject} onChange={(e) => setNewProject(e.target.value)} />
          <button disabled={isCreating || !newProject} className="bg-blue-600 text-white p-3 rounded-xl">{isCreating ? <Loader2 className="animate-spin" /> : <Plus size={24} />}</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#16181e] border border-gray-800 p-6 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-4">{project.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setActiveProjectId(project.id); setModalOpen(true); }} className="bg-[#0f1117] border border-gray-800 py-3 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Github size={12} /> Sync
              </button>
              <Link href={`/dashboard/projects/${project.id}/doc`} className="bg-blue-600/10 border border-blue-500/20 py-3 rounded-xl text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <BookOpen size={12} /> Read Docs
              </Link>
            </div>
          </div>
        ))}
      </div>
      <SyncModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSync={handleSyncAction} isSyncing={!!isSyncing} />
    </div>
  )
}
