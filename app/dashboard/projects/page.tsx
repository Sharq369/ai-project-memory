'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Github, Gitlab, HardDrive, Zap, X, Loader2, Globe, Edit2, RefreshCw } from 'lucide-react'

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
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
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
      alert("Neural Link Established.")
      setSelectedNode(null)
      fetchProjects()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f1117]"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black italic uppercase mb-12">Project Vault</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#16181e] border border-gray-800 rounded-[2rem] p-8">
              <div className="flex justify-between mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center"><Globe size={18} className="text-blue-500" /></div>
              </div>
              
              <h2 className="text-2xl font-black italic uppercase mb-4">{project.name}</h2>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-8">
                Last Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Never'}
              </p>

              <div className="flex gap-4">
                <button className="flex-1 bg-gray-900 border border-gray-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Enter Node</button>
                <button 
                  onClick={() => setSelectedNode(project)} 
                  className="bg-blue-600 p-4 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-blue-900/20"
                >
                  <Zap size={20} fill="white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SELECTION MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-[#111319] border border-gray-800 rounded-[2.5rem] p-8 w-full max-w-sm">
            <div className="flex justify-between mb-6">
              <h3 className="text-xl font-black italic uppercase">Select Source</h3>
              <button onClick={() => setSelectedNode(null)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => triggerSync(selectedNode.id, selectedNode.repo_url)}
                className="w-full flex items-center justify-between bg-gray-900 p-4 rounded-2xl border border-gray-800 hover:border-blue-500 transition-all"
              >
                <div className="flex items-center gap-3"><Github size={20}/><span className="text-[10px] font-black uppercase tracking-widest">GitHub</span></div>
                {isSyncing && <Loader2 className="animate-spin" size={16}/>}
              </button>
              <button className="w-full flex items-center gap-3 bg-gray-900 p-4 rounded-2xl opacity-30 cursor-not-allowed border border-gray-800">
                <Gitlab size={20}/><span className="text-[10px] font-black uppercase tracking-widest">GitLab</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
