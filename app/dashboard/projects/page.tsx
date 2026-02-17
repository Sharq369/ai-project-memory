'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { syncGitHubRepo } from '../../../lib/github'
import { 
  Folder, Plus, Loader2, Calendar, 
  Trash2, Layers, Github, RefreshCw, 
  BookOpen, X, Sparkles 
} from 'lucide-react'

// --- Professional Modal Component ---
function SyncModal({ isOpen, onClose, onSync, isSyncing }: any) {
  const [url, setUrl] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-blue-500/10 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">
              <Github size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Sync Repository</h3>
              <p className="text-xs text-gray-500">Connect source code to the AI Author.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Public GitHub URL</label>
            <input 
              autoFocus
              className="w-full mt-2 bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-mono text-sm"
              placeholder="https://github.com/user/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-800 text-gray-400 hover:bg-gray-800 transition-colors font-bold text-[10px] uppercase"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSync(url)}
              disabled={isSyncing || !url}
              className="flex-[2] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={16} /> : 'Begin Analysis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Page Component ---
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete project? Memories will remain but become unlinked.")) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) setProjects(projects.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#16181e] p-8 rounded-3xl border border-gray-800 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Project Vault</h1>
          <p className="text-gray-500 text-sm">Organize codebases and neural documentation context.</p>
        </div>

        <form onSubmit={handleCreate} className="flex w-full md:w-auto gap-2">
          <input
            className="bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 w-full md:w-64 transition-all"
            placeholder="New Project Name..."
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
          />
          <button disabled={isCreating || !newProject} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all">
            {isCreating ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
          </button>
        </form>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-700" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="group bg-[#16181e] border border-gray-800 p-6 rounded-3xl hover:border-blue-500/30 transition-all relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-600/5 rounded-2xl border border-blue-500/10">
                  <Folder className="text-blue-400" size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
              
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase">
                  <Layers size={12} /> {project.memories?.[0]?.count || 0} Contexts
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase">
                  <Calendar size={12} /> {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-6">
                <button 
                  onClick={() => { setActiveProjectId(project.id); setModalOpen(true); }}
                  disabled={isSyncing === project.id}
                  className="flex items-center justify-center gap-2 bg-[#0f1117] border border-gray-800 hover:border-blue-500/50 py-3 rounded-xl text-[10px] font-bold text-gray-400 hover:text-blue-400 transition-all uppercase tracking-widest"
                >
                  {isSyncing === project.id ? <RefreshCw className="animate-spin" size={12} /> : <Github size={12} />}
                  Sync
                </button>

                <Link 
                  href={`/dashboard/projects/${project.id}/doc`}
                  className="flex items-center justify-center gap-2 bg-blue-600/5 border border-blue-500/10 hover:bg-blue-600/10 py-3 rounded-xl text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all uppercase tracking-widest"
                >
                  <BookOpen size={12} />
                  Read Docs
                </Link>
              </div>

              <button onClick={() => handleDelete(project.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <SyncModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSync={handleSyncAction}
        isSyncing={!!isSyncing}
      />
    </div>
  )
}
