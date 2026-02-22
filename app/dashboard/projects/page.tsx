'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Globe, Lock, MoreVertical, Zap, Loader2, X, Github } from 'lucide-react'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [repoUrl, setRepoUrl] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  // THE FIX: Points to your actual path app/api/sync/trigger/route.ts
  const handleSync = async () => {
    if (!repoUrl || !selectedProject) return
    setIsSyncing(true)
    
    try {
      const res = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl,
          projectId: selectedProject.id
        })
      })

      if (res.ok) {
        setShowSyncModal(false)
        router.push(`/dashboard/projects/${selectedProject.id}/doc`)
      } else {
        const err = await res.json()
        alert(`Sync Error: ${err.error || 'Unknown failure'}`)
      }
    } catch (error) {
      console.error("Connection failed", error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f1117]"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Active Nodes: {projects.length}</p>
        </div>
      </div>

      {/* PROJECT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#16181e] border border-gray-800 p-8 rounded-[2.5rem] hover:border-blue-500 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500"><Globe size={20} /></div>
              <button className="text-gray-600 hover:text-white"><MoreVertical size={18} /></button>
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">{project.name}</h3>
            <p className="text-gray-500 text-[10px] font-mono mb-8">{project.id.slice(0, 12)}</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)}
                className="flex-1 bg-[#0f1117] border border-gray-800 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Enter Node
              </button>
              <button 
                onClick={() => { setSelectedProject(project); setShowSyncModal(true); }}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 transition-all"
              >
                <Zap size={16} fill="white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NEURAL SYNC MODAL */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-white font-black italic uppercase tracking-tighter">Neural Sync</h2>
                <button onClick={() => setShowSyncModal(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Repository URL</label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    className="w-full bg-[#0f1117] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-xs text-white outline-none focus:border-blue-500"
                    placeholder="https://github.com/..."
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
              </div>

              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={16} /> : 'Establish Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
