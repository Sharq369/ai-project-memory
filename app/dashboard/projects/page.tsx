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
      const { data, error } = await supabase.from('projects').select(`*, code_memories!project_id(id)`)
      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      const { data } = await supabase.from('projects').select('*')
      setProjects(data || [])
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="relative">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">Project Vault</h1>
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Nodes Active: {projects.length}</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] p-8 relative shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20">
                <Globe size={20} className="text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-black italic uppercase mb-1 tracking-tighter">{project.name}</h2>
              <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] mb-10">
                {project.code_memories?.length || 0} Memories
              </p>

              <div className="flex gap-4">
                <button className="flex-[3] bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest">
                  Enter
                </button>
                {/* ZAP BUTTON FIX: Handled inside the natural flow */}
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-blue-600 flex items-center justify-center rounded-xl active:bg-blue-400"
                >
                  <Zap size={20} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FIX: High z-index and fixed positioning */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0f1116] border border-gray-800/60 rounded-[3rem] p-10 w-full max-w-sm relative shadow-2xl">
            <div className="flex justify-between items-start mb-10">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Select Source</h3>
              <button onClick={() => setSelectedNode(null)} className="p-2 text-gray-500 active:text-white"><X size={28} /></button>
            </div>
            
            <div className="space-y-4">
              <button onClick={() => alert("GitHub")} className="w-full flex items-center gap-4 bg-[#16181e] p-6 rounded-2xl border border-gray-800 active:border-blue-500 transition-all">
                <Github size={20}/> <span className="text-[10px] font-bold uppercase tracking-widest">GitHub Protocol</span>
              </button>
              <button onClick={() => alert("GitLab")} className="w-full flex items-center gap-4 bg-[#16181e] p-6 rounded-2xl border border-gray-800 active:border-orange-500 transition-all">
                <Gitlab size={20}/> <span className="text-[10px] font-bold uppercase tracking-widest">GitLab Protocol</span>
              </button>
              <button onClick={() => alert("Bitbucket")} className="w-full flex items-center gap-4 bg-[#16181e] p-6 rounded-2xl border border-gray-800 active:border-cyan-500 transition-all">
                <GitBranch size={20}/> <span className="text-[10px] font-bold uppercase tracking-widest">Bitbucket Protocol</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
