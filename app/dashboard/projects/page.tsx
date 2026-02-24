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
  const [isMounted, setIsMounted] = useState(false)

  // HYDRATION GUARD: Ensures the mobile browser is ready for JS
  useEffect(() => {
    setIsMounted(true)
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, code_memories!project_id(id)`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      const { data } = await supabase.from('projects').select('*')
      setProjects(data || [])
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async (project: any) => {
    if (!project) return
    setActiveSyncId(project.id)
    try {
      const res = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, repoUrl: project.repo_url })
      })
      if (res.ok) {
        setSelectedNode(null)
        fetchProjects()
      }
    } catch (err) {
      alert("Sync Error")
    } finally {
      setActiveSyncId(null)
    }
  }

  // Prevent rendering until mounted to fix "nothing clicks" issues
  if (!isMounted) return null

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b0c10]">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
            Nodes Active: {projects.length}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/60 rounded-[2.5rem] p-8 relative z-10">
              
              {/* Using onPointerDown for instant mobile response */}
              <div className="absolute top-4 right-4 flex gap-1 z-50">
                <div 
                  onPointerDown={() => alert("Edit Mode")}
                  className="p-4 text-gray-600 active:text-white cursor-pointer"
                >
                  <Pencil size={18} />
                </div>
                <div 
                  onPointerDown={() => triggerSync(project)}
                  className="p-4 text-gray-600 active:text-blue-500 cursor-pointer"
                >
                  <RotateCw size={18} className={activeSyncId === project.id ? "animate-spin" : ""} />
                </div>
              </div>

              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                <Globe size={20} className="text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-black italic uppercase mb-1 tracking-tight pr-16">{project.name}</h2>
              
              <div className="mb-8">
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">
                  {project.code_memories?.length || 0} Memory Blocks
                </p>
              </div>

              <div className="flex gap-3 relative z-50">
                <button 
                  onPointerDown={() => alert("Entering Node...")}
                  className="flex-[3] bg-transparent border border-gray-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:bg-white/5"
                >
                  Enter Node
                </button>
                <button 
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setSelectedNode(project);
                  }}
                  className="flex-1 bg-blue-700 flex items-center justify-center rounded-2xl active:bg-blue-500 shadow-lg"
                >
                  <Zap size={20} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0f1116] border border-gray-800 rounded-[2.5rem] p-10 w-full max-w-sm relative z-[110]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black italic uppercase">Source</h3>
              <div onPointerDown={() => setSelectedNode(null)} className="p-4 -m-4 cursor-pointer">
                <X size={24} />
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onPointerDown={() => triggerSync(selectedNode)}
                className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 active:border-blue-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <Github size={20} />
                  </div>
                  <span className="text-xs font-black uppercase">GitHub</span>
                </div>
                {activeSyncId === selectedNode.id ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Zap size={16} className="text-gray-700" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
