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

  // FIX: Ensures the mobile browser is ready for interaction
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
      alert("Neural Link Sync Failed")
    } finally {
      setActiveSyncId(null)
    }
  }

  if (!isMounted) return null

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b0c10]">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-6 md:p-10 font-sans tracking-tight">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER: REAL DESIGN RESTORED */}
        <header className="mb-16 mt-8">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Project Vault</h1>
          <p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.4em]">
            Nodes Active: {projects.length}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[3rem] p-10 relative group">
              
              {/* TOP ICONS: High Z-index and larger tap area */}
              <div className="absolute top-8 right-8 flex gap-2 z-50">
                <button 
                  className="p-4 text-gray-600 active:text-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); alert("Edit Mode: " + project.name); }}
                >
                  <Pencil size={18} />
                </button>
                <button 
                  className={`p-4 text-gray-600 active:text-blue-500 transition-all ${activeSyncId === project.id ? 'animate-spin text-blue-500' : ''}`}
                  onClick={(e) => { e.stopPropagation(); triggerSync(project); }}
                >
                  <RotateCw size={18} />
                </button>
              </div>

              <div className="w-14 h-14 rounded-full bg-blue-500/5 flex items-center justify-center mb-10 border border-blue-500/10">
                <Globe size={24} className="text-blue-500" />
              </div>
              
              <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tighter pr-10">{project.name}</h2>
              
              <div className="space-y-1 mb-12">
                <p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.2em]">
                  {project.code_memories?.length || 0} Memory Blocks Retrieved
                </p>
                <p className="text-gray-600 text-[9px] font-bold uppercase tracking-[0.2em]">
                  Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Establishing...'}
                </p>
              </div>

              {/* FOOTER BUTTONS: Forced Z-index */}
              <div className="flex gap-4 relative z-50">
                <button className="flex-[3] bg-transparent border border-gray-800 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] active:bg-white/5 transition-all">
                  Enter Node
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedNode(project); }}
                  className="flex-1 bg-[#1d4ed8] flex items-center justify-center rounded-[1.5rem] active:bg-blue-600 transition-all shadow-[0_0_20px_rgba(29,78,216,0.2)]"
                >
                  <Zap size={22} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SOURCE MODAL: RESTORED REAL DESIGN */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="bg-[#0f1116] border border-gray-800/60 rounded-[3.5rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
            
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-start mb-12 relative z-10">
              <div>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter">Select Source</h3>
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Neural Link Authorization</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-4 -m-4 text-gray-600 active:text-white transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="space-y-4 relative z-10">
              <button 
                onClick={() => triggerSync(selectedNode)}
                className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 active:border-blue-500 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                    <Github size={24}/>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">GitHub Protocol</span>
                </div>
                {activeSyncId === selectedNode.id ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <Zap size={18} className="text-gray-700" />}
              </button>

              <div className="w-full flex items-center gap-5 bg-[#0f1116] p-7 rounded-[2rem] border border-gray-900/50 opacity-30">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center"><Gitlab size={24} className="text-gray-500" /></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">GitLab Link</span>
              </div>

              <div className="w-full flex items-center gap-5 bg-[#0f1116] p-7 rounded-[2rem] border border-gray-900/50 opacity-30">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center"><Database size={24} className="text-gray-500" /></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Bitbucket Link</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
