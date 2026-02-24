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
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, code_memories!project_id(id)`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setProjects(data)
    } catch (err: any) {
      console.error("Fetch failed:", err.message)
      const { data } = await supabase.from('projects').select('*')
      if (data) setProjects(data)
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async (project: any) => {
    setActiveSyncId(project.id)
    try {
      const res = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, repoUrl: project.repo_url })
      })
      if (!res.ok) throw new Error("Sync failed")
      
      setSelectedNode(null)
      fetchProjects()
    } catch (err: any) {
      alert(`Sync Failed: ${err.message}`)
    } finally {
      setActiveSyncId(null)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b0c10]">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-6 font-sans select-none">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10 pt-4">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
            Nodes Active: {projects.length}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/60 rounded-[2.5rem] p-8 relative">
              
              <div className="absolute top-4 right-4 flex gap-1 z-30">
                <button 
                  onClick={() => alert("Edit " + project.name)}
                  className="p-4 text-gray-600 active:text-white"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => triggerSync(project)}
                  className="p-4 text-gray-600 active:text-blue-500"
                >
                  <RotateCw size={18} className={activeSyncId === project.id ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                <Globe size={20} className="text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-black italic uppercase mb-1 tracking-tight pr-16">
                {project.name}
              </h2>
              
              <div className="mb-8">
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">
                  {project.code_memories?.length || 0} Memory Blocks
                </p>
                <p className="text-gray-600 text-[9px] font-bold uppercase mt-1">
                  Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Offline'}
                </p>
              </div>

              <div className="flex gap-3 relative z-20">
                <button 
                  onClick={() => alert("Entering " + project.name)}
                  className="flex-[3] bg-transparent border border-gray-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:bg-white/5"
                >
                  Enter Node
                </button>
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-blue-700 flex items-center justify-center rounded-2xl active:bg-blue-500 active:scale-95 transition-all shadow-lg"
                >
                  <Zap size={20} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0f1116] border border-gray-800 rounded-t-[3rem] md:rounded-[3rem] p-10 w-full max-w-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black italic uppercase">Source</h3>
              <button onClick={() => setSelectedNode(null)} className="p-4 -m-4"><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => triggerSync(selectedNode)}
                className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 active:border-blue-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <Github size={20} />
                  </div>
                  <span className="text-xs font-black uppercase">GitHub Protocol</span>
                </div>
                {activeSyncId === selectedNode.id ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Zap size={16} className="text-gray-700" />}
              </button>

              <div className="w-full flex items-center gap-4 bg-[#0b0c10] p-6 rounded-2xl border border-gray-900 opacity-20">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Gitlab size={20} /></div>
                <span className="text-xs font-black uppercase">GitLab Link</span>
              </div>

              <div className="w-full flex items-center gap-4 bg-[#0b0c10] p-6 rounded-2xl border border-gray-900 opacity-20">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Database size={20} /></div>
                <span className="text-xs font-black uppercase">Bitbucket Link</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
