'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Github, Gitlab, Database, Zap, X, Loader2, 
  Globe, Pencil, RotateCw 
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectVault() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      // 1. Try fetching with the memory count join
      let { data, error } = await supabase
        .from('projects')
        .select(`*, code_memories!project_id(id)`)
        .order('created_at', { ascending: false })
      
      // 2. Fallback: If relationship error occurs, fetch projects alone to ensure UI loads
      if (error && error.message.includes('relationship')) {
        console.warn("Supabase Join Error - Falling back to simple fetch")
        const fallback = await supabase
          .from('projects')
          .select(`*`)
          .order('created_at', { ascending: false })
        data = fallback.data
        error = fallback.error
      }

      if (error) throw error
      if (data) setProjects(data)
    } catch (err: any) {
      console.error("Link Error:", err.message)
      // Removing the alert so it doesn't block the user if data exists
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async (projectId: string, repoUrl: string) => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, repoUrl })
      })
      if (!res.ok) throw new Error("Sync failed")
      setSelectedNode(null)
      fetchProjects()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b0c10]">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black italic uppercase tracking-tight">Project Vault</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
            Nodes Active: {projects.length}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#16181e] border border-gray-800/50 rounded-[2.5rem] p-8 relative group">
              
              {/* RESTORED ICONS: Pencil and Sync/Refresh */}
              <div className="absolute top-8 right-8 flex gap-4 text-gray-600">
                <Pencil size={16} className="hover:text-white cursor-pointer transition-colors" />
                <RotateCw size={16} className="hover:text-white cursor-pointer transition-colors" />
              </div>

              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-8">
                <Globe size={20} className="text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-black italic uppercase mb-1">{project.name}</h2>
              
              {/* MEMORY BLOCK STATUS */}
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">
                {project.code_memories?.length || 0} Memory Blocks Active
              </p>
              
              <p className="text-gray-600 text-[9px] uppercase tracking-widest mb-10">
                Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Waiting...'}
              </p>

              <div className="flex gap-4">
                <button className="flex-1 bg-transparent border border-gray-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Enter Node
                </button>
                <button 
                  onClick={() => setSelectedNode(project)} 
                  className="bg-blue-600 p-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                >
                  <Zap size={20} fill="white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FULL PROVIDER MODAL: Includes Bitbucket */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-[#111319] border border-gray-800 rounded-[3rem] p-10 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Select Source</h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              {/* GitHub */}
              <button 
                onClick={() => triggerSync(selectedNode.id, selectedNode.repo_url)}
                className="w-full flex items-center justify-between bg-[#1a1d26] p-6 rounded-2xl border border-gray-800 hover:border-blue-500 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Github size={22}/>
                  <span className="text-xs font-black uppercase tracking-widest">GitHub</span>
                </div>
                {isSyncing ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Zap size={16} className="text-gray-700 group-hover:text-blue-500" />}
              </button>

              {/* GitLab */}
              <button className="w-full flex items-center gap-4 bg-[#111319] p-6 rounded-2xl border border-gray-900 opacity-40 cursor-not-allowed">
                <Gitlab size={22} className="text-gray-600" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-600">GitLab</span>
              </button>

              {/* Bitbucket RESTORED */}
              <button className="w-full flex items-center gap-4 bg-[#111319] p-6 rounded-2xl border border-gray-900 opacity-40 cursor-not-allowed">
                <Database size={22} className="text-gray-600" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-600">Bitbucket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
