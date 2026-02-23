'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Globe, MoreVertical, Zap, Loader2, X, Github, Gitlab, Cpu } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [repoUrl, setRepoUrl] = useState('')
  const [provider, setProvider] = useState('github') 
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    async function fetchProjects() {
      // Joining with code_memories to get the count
      const { data, error } = await supabase
        .from('projects')
        .select('*, code_memories(count)')
        .order('created_at', { ascending: false })
      
      if (!error) {
        const formatted = data.map(p => ({
          ...p,
          blockCount: p.code_memories?.[0]?.count || 0
        }))
        setProjects(formatted)
      }
      setLoading(false)
    }
    fetchProjects()
  }, [])

  const handleSync = async () => {
    if (!repoUrl || !selectedProject) return
    setIsSyncing(true)
    try {
      const res = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoUrl, 
          projectId: selectedProject.id,
          provider // Now passing the provider (github/gitlab/bitbucket)
        })
      })
      if (res.ok) {
        setShowSyncModal(false)
        router.push(`/dashboard/projects/${selectedProject.id}/doc`)
      }
    } catch (e) { console.error(e) } finally { setIsSyncing(false) }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f1117]"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 min-h-screen bg-[#0f1117]">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Nodes active: {projects.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#16181e] border border-gray-800 p-8 rounded-[2.5rem] relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500"><Globe size={20} /></div>
              <button className="text-gray-600 hover:text-white"><MoreVertical size={18} /></button>
            </div>
            
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">{project.name}</h3>
            {/* Design Fix: Added block count display */}
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest mb-8">
              {project.blockCount} Memory Blocks Retrieved
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} 
                className="flex-1 bg-[#0f1117] border border-gray-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Enter Node
              </button>
              <button 
                onClick={() => { setSelectedProject(project); setShowSyncModal(true); }} 
                className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
              >
                <Zap size={16} fill="white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Design Fix: Redesigned Modal with Provider Selection */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-[3rem] p-10 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter">Neural Sync</h2>
              <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">Source Provider</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'github', icon: <Github size={18}/>, name: 'GitHub' },
                { id: 'gitlab', icon: <Gitlab size={18}/>, name: 'GitLab' },
                { id: 'bitbucket', icon: <Cpu size={18}/>, name: 'Bitbucket' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    provider === p.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0f1117] border-gray-800 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  {p.icon}
                  <span className="text-[8px] font-black uppercase">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <input 
                className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-blue-500" 
                placeholder={`${provider.charAt(0).toUpperCase() + provider.slice(1)} URL`}
                value={repoUrl} 
                onChange={(e) => setRepoUrl(e.target.value)} 
              />
              <button 
                onClick={handleSync} 
                className="w-full bg-blue-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={16} /> : 'Establish Link'}
              </button>
              <button onClick={() => setShowSyncModal(false)} className="w-full text-gray-600 text-[9px] uppercase font-black tracking-widest hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
