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

  // MOBILE CRASH DETECTOR: This will pop up an alert on your phone if the page breaks
  useEffect(() => {
    const handleMobileError = (e: ErrorEvent) => {
      alert(`Mobile Debug - Crash Detected: ${e.message}`)
    }
    window.addEventListener('error', handleMobileError)
    
    fetchProjects()

    return () => window.removeEventListener('error', handleMobileError)
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
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-6 md:p-10 font-sans tracking-tight">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 mt-8 md:mt-0">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Project Vault</h1>
          <p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.4em]">
            Nodes Active: {projects.length}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 relative group">
              
              {/* TOP ACTION ICONS: Added 'p-3' to create a massive invisible thumb-tap area */}
              <div className="absolute top-6 right-6 md:top-10 md:right-10 flex gap-2 text-gray-500 z-30">
                <button 
                  className="p-3 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    alert(`Edit mode for ${project.name}`)
                  }}
                >
                  <Pencil size={20} />
                </button>

                <button 
                  className={`p-3 hover:text-white transition-all ${activeSyncId === project.id ? 'animate-spin text-blue-500' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    triggerSync(project)
                  }}
                >
                  <RotateCw size={20} />
                </button>
              </div>

              <div className="w-14 h-14 rounded-full bg-blue-500/5 flex items-center justify-center mb-8 border border-blue-500/10">
                <Globe size={24} className="text-blue-500" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black italic uppercase mb-2 tracking-tighter w-[80%] break-words">
                {project.name}
              </h2>
              
              <div className="space-y-1 mb-10">
                <p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.2em]">
                  {project.code_memories?.length || 0} Memory Blocks Retrieved
                </p>
                <p className="text-gray-600 text-[9px] font-bold uppercase tracking-[0.2em]">
                  Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Establishing...'}
                </p>
              </div>

              {/* FOOTER BUTTONS: Changed to explicit type="button" for mobile compatibility */}
              <div className="flex gap-4 relative z-30">
                <button 
                  type="button"
                  className="flex-[3] bg-transparent border border-gray-800 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all active:bg-gray-800"
                >
                  Enter Node
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedNode(project)
                  }}
                  className="flex-1 bg-[#1d4ed8] flex items-center justify-center rounded-[1.5rem] hover:bg-blue-600 active:bg-blue-800 transition-all shadow-lg"
                >
                  <Zap size={22} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Added safe-area padding for mobile screens */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-6 transition-all overflow-y-auto">
          <div className="bg-[#0f1116] border border-gray-800/60 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 w-full max-w-md shadow-2xl relative my-auto">
            
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <h3 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">Select Source</h3>
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Neural Link Authorization</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedNode(null)} 
                className="p-2 -m-2 text-gray-600 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="space-y-4 relative z-10">
              <button 
                type="button"
                onClick={() => triggerSync(selectedNode)}
                className="w-full flex items-center justify-between bg-[#16181e] p-6 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border border-gray-800 hover:border-blue-500 active:border-blue-500 transition-all group"
              >
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center group-active:bg-blue-500/10">
                    <Github size={20} md:size={24}/>
                  </div>
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em]">GitHub Protocol</span>
                </div>
                {activeSyncId === selectedNode.id ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <Zap size={18} className="text-gray-700" />}
              </button>

              <button type="button" className="w-full flex items-center gap-4 md:gap-5 bg-[#0f1116] p-6 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border border-gray-900/50 opacity-30 cursor-not-allowed">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center"><Gitlab size={20} className="text-gray-500" /></div>
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">GitLab Link</span>
              </button>

              <button type="button" className="w-full flex items-center gap-4 md:gap-5 bg-[#0f1116] p-6 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border border-gray-900/50 opacity-30 cursor-not-allowed">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center"><Database size={20} className="text-gray-500" /></div>
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Bitbucket Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
