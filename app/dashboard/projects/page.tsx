'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Github, Gitlab, GitBranch, Globe, Zap, X, Loader2, Pencil, RotateCw } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectVault() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      // Simplified query to prevent silent failures
      const { data, error } = await supabase
        .from('projects')
        .select('*')
      
      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error("Fetch error:", err)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen text-white font-sans">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">Project Vault</h1>
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Nodes Active: {projects.length}</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[3rem] p-10 relative shadow-2xl">
              <div className="absolute top-8 right-8 flex gap-2">
                <button onClick={() => fetchProjects()} className="p-3 text-gray-600 active:text-blue-500"><RotateCw size={18} /></button>
              </div>

              <div className="w-14 h-14 rounded-full bg-blue-500/5 flex items-center justify-center mb-10 border border-blue-500/10 text-blue-500">
                <Globe size={24} />
              </div>
              
              <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tighter">{project.name}</h2>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-12">Neural Node Active</p>

              <div className="flex gap-4">
                <button className="flex-[3] bg-transparent border border-gray-800 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] active:bg-white/5 transition-all">
                  Enter Node
                </button>
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-blue-700 flex items-center justify-center rounded-[1.5rem] active:bg-blue-500"
                >
                  <Zap size={22} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-[#0f1116] border border-gray-800/60 rounded-[3.5rem] p-10 w-full max-w-md relative shadow-2xl">
            <div className="flex justify-between items-start mb-12">
              <h3 className="text-4xl font-black italic uppercase tracking-tighter">Source</h3>
              <button onClick={() => setSelectedNode(null)} className="p-2 text-gray-500 active:text-white"><X size={28} /></button>
            </div>
            
            <div className="space-y-4">
              <button onClick={() => alert("GitHub")} className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 active:border-blue-500 transition-all text-white font-black uppercase text-[11px] tracking-widest">
                <div className="flex items-center gap-5"><Github size={24}/> GitHub Protocol</div>
                <Zap size={18} className="text-gray-700" />
              </button>
              <button onClick={() => alert("GitLab")} className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 active:border-orange-500 transition-all text-white font-black uppercase text-[11px] tracking-widest">
                <div className="flex items-center gap-5"><Gitlab size={24}/> GitLab Protocol</div>
                <Zap size={18} className="text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
