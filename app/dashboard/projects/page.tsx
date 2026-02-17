'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { syncGitHubRepo } from '../../../lib/github'
import { 
  Folder, Plus, Loader2, Calendar, 
  Trash2, Activity, Layers, Github, RefreshCw, AlertCircle 
} from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    // Fetch projects and count their related memories
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        memories:memories(count)
      `)
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

  const handleSync = async (projectId: string) => {
    const url = prompt("Enter Public GitHub URL (e.g., https://github.com/user/repo):")
    if (!url) return

    setIsSyncing(projectId)
    const result = await syncGitHubRepo(url, projectId)
    
    if (result.success) {
      alert(`Success! Ingested ${result.count} files.`)
      fetchProjects() 
    } else {
      alert("Sync Failed: " + result.error)
    }
    setIsSyncing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete project? Linked memories will become unlinked.")) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) setProjects(projects.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Header & Quick Add */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#16181e] p-8 rounded-3xl border border-gray-800 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Project Vault</h1>
          <p className="text-gray-500 text-sm">Organize your codebases and neural context.</p>
        </div>

        <form onSubmit={handleCreate} className="flex w-full md:w-auto gap-2">
          <input
            className="bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 w-full md:w-64 transition-all"
            placeholder="New Project Name..."
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
          />
          <button 
            disabled={isCreating || !newProject}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
          </button>
        </form>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-700" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="group bg-[#16181e] border border-gray-800 p-6 rounded-2xl hover:border-blue-500/40 transition-all relative">
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-600/5 rounded-xl border border-blue-500/10">
                  <Folder className="text-blue-400" size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
              
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Layers size={14} />
                  <span>{project.memories?.[0]?.count || 0} Contexts</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={14} />
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* GitHub Sync Button */}
              <button 
                onClick={() => handleSync(project.id)}
                disabled={isSyncing === project.id}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#0f1117] border border-gray-800 hover:border-blue-500/50 py-3 rounded-xl text-[10px] font-bold text-gray-400 hover:text-blue-400 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {isSyncing === project.id ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <Github size={14} />
                )}
                {isSyncing === project.id ? 'Analyzing Repo...' : 'Sync GitHub Repo'}
              </button>

              {/* Delete Hover Action */}
              <button 
                onClick={() => handleDelete(project.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
