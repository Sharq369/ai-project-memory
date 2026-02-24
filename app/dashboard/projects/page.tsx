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
      // Solving the relationship error while fetching memory count
      const { data, error } = await supabase
        .from('projects')
        .select(`*, code_memories!project_id(id)`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setProjects(data)
    } catch (err: any) {
      // Fallback to simple fetch if relationship is still bugged
      const { data } = await supabase.from('projects').select('*')
      if (data) setProjects(data)
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async (project: any) => {
    setActiveSyncId(project.id)
    try {
      const res = await fetch('/api/sync/trigger', { // Matches your file path
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, repoUrl: project.repo_url })
      })

      if (!res.ok) throw new Error("Sync Failed")
      
      setSelectedNode(null)
      fetchProjects()
    } catch (err: any) {
      alert(`Sync Error: ${err.message}`)
    } finally {
      setActiveSyncId(null)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b0c10]">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-10 font-sans tracking-tight">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-16">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Project Vault</h1>
          <p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.4em]">
            Nodes Active: {projects.length}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[3rem] p-10 relative group hover:border-blue-500/30 transition-all duration-500">
              
              {/* Top Action Icons */}
              <div className="absolute top-10 right-10 flex gap-5 text-gray-500">
                <Pencil size={18} className="hover:text-white cursor-pointer transition-colors" />
                <RotateCw 
                  size={18} 
                  className={`hover:text-white cursor-pointer transition-all ${activeSyncId === project.id ? 'animate-spin text-blue-500' : ''}`} 
                  onClick={() => triggerSync(project)}
                />
              </div>

              {/* Node Icon */}
              <div className="w-14 h-14 rounded-full bg-blue-500/5 flex items-center justify-center mb-10 border border-blue-500/10">
                <Globe size={24} className="text-blue-500" />
              </div>
              
              <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tighter">{project.name}</h2>
              
              {/* Status Labels */}
              <div className="space-y-1 mb-12">
                <p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.2em]">
                  {project.code_memories?.length || 0} Memory Blocks Retrieved
                </p>
                <p className="text-gray-600 text-[9px] font-bold uppercase tracking-[0.2em]">
                  Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Establishing...'}
                </p>
              </div>

              {/* Card Footer Buttons */}
              <div className="flex gap-4">
                <button className="flex-[3] bg-transparent border border-gray-800 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
                  Enter Node
                </button>
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-[#1d4ed8] flex items-center justify-center rounded-[1.5rem] hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(29,78,216,0.2)]"
                >
                  <Zap size={22} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* THE SOURCE MODAL: RESTORED DESIGN */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 transition-all">
          <div className="bg-[#0f1116] border border-gray-800/60 rounded-[3.5rem] p-12 w-full max-w-md shadow-2xl relative overflow-hidden">
            
            {/* Background Accent */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 blur-[80px] rounded-full" />

            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter">Select Source</h3>
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Neural Link Authorization</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-gray-600 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* GitHub Link */}
              <button 
                onClick={() => triggerSync(selectedNode)}
                className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 hover:border-blue-500 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/10">
                    <Github size={24}/>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">GitHub Protocol</span>
                </div>
                {activeSyncId === selectedNode.id ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <Zap size={18} className="text-gray-700 group-hover:text-blue-500" />}
              </button>

              {/* GitLab (Locked) */}
              <button className="w-full flex items-center gap-5 bg-[#0f1116] p-7 rounded-[2rem] border border-gray-900/50 opacity-30 cursor-not-allowed">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <Gitlab size={24} className="text-gray-500" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">GitLab Link</span>
              </button>

              {/* Bitbucket (Locked) */}
              <button className="w-full flex items-center gap-5 bg-[#0f1116] p-7 rounded-[2rem] border border-gray-900/50 opacity-30 cursor-not-allowed">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <Database size={24} className="text-gray-500" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Bitbucket Link</span>
              </button>
            </div>

            <p className="mt-12 text-center text-gray-700 text-[8px] font-black uppercase tracking-[0.5em]">
              Neural Link Protocol v1.5.2
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
