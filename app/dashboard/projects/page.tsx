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
      // ADDED !project_id TO RESOLVE MULTIPLE RELATIONSHIPS ERROR
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          code_memories!project_id (id)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      if (data) setProjects(data)
    } catch (err: any) {
      console.error("Link Error:", err.message)
      alert(`Neural Link Error: ${err.message}`)
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0b0c10]"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black italic uppercase tracking-tight mb-12">Project Vault</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#16181e] border border-gray-800/50 rounded-[2.5rem] p-8 relative">
              <div className="absolute top-8 right-8 flex gap-4 text-gray-600">
                <Pencil size={16} className="hover:text-white cursor-pointer" />
                <RotateCw size={16} className="hover:text-white cursor-pointer" />
              </div>

              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-8">
                <Globe size={20} className="text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-black italic uppercase mb-1">{project.name}</h2>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">
                {project.code_memories?.length || 0} Memory Blocks Retrieved
              </p>
              <p className="text-gray-600 text-[9px] uppercase tracking-widest mb-10">
                Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Pending...'}
              </p>

              <div className="flex gap-4">
                <button className="flex-1 bg-transparent border border-gray-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
                  Enter Node
                </button>
                <button onClick={() => setSelectedNode(project)} className="bg-blue-600 p-4 rounded-2xl">
                  <Zap size={20} fill="white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROVIDER SELECTION MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-[#111319] border border-gray-800 rounded-[3rem] p-10 w-full max-w-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Select Source</h3>
              <button onClick={() => setSelectedNode(null)}><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              <button onClick={() => triggerSync(selectedNode.id, selectedNode.repo_url)} className="w-full flex items-center justify-between bg-[#1a1d26] p-6 rounded-2xl border border-gray-800 hover:border-blue-500 group">
                <div className="flex items-center gap-4"><Github size={22}/><span className="text-xs font-black uppercase tracking-widest">GitHub</span></div>
                {isSyncing ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Zap size={16} className="text-gray-700 group-hover:text-blue-500" />}
              </button>

              <button className="w-full flex items-center gap-4 bg-[#111319] p-6 rounded-2xl border border-gray-900 opacity-40 cursor-not-allowed">
                <Gitlab size={22} className="text-gray-600" /><span className="text-xs font-black uppercase tracking-widest text-gray-600">GitLab</span>
              </button>

              <button className="w-full flex items-center gap-4 bg-[#111319] p-6 rounded-2xl border border-gray-900 opacity-40 cursor-not-allowed">
                <Database size={22} className="text-gray-600" /><span className="text-xs font-black uppercase tracking-widest text-gray-600">Bitbucket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
