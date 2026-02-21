'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Folder, Plus, Loader2, X, Github, Gitlab, Box, CheckCircle2 } from 'lucide-react'

// ─── NEURAL SYNC MODAL ──────────────────────────────────────────────────────
function SyncModal({ isOpen, onClose, onSync, isSyncing }: any) {
  const [url, setUrl] = useState('')
  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Neural Sync</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          {(['github', 'gitlab', 'bitbucket'] as const).map((p) => (
            <button 
              key={p}
              onClick={() => setProvider(p)} 
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${provider === p ? 'bg-white text-black border-white' : 'bg-[#0f1117] border-gray-800 text-gray-500 hover:border-gray-600'}`}
            >
              {p === 'github' && <Github size={20} />}
              {p === 'gitlab' && <Gitlab size={20} />}
              {p === 'bitbucket' && <Box size={20} />}
              <span className="text-[9px] font-black uppercase tracking-widest">{p}</span>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-4">Target Repository URL</p>
        <input 
          className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl px-6 py-4 text-white mb-8 outline-none focus:border-blue-500 transition-all font-mono text-xs" 
          placeholder={`https://${provider}.com/repo`} 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          disabled={isSyncing} 
        />
        
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-gray-800 rounded-xl text-gray-500">Cancel</button>
          <button 
            onClick={() => onSync(url, provider)} 
            disabled={isSyncing || !url} 
            className="flex-[2] py-4 text-[10px] font-black uppercase tracking-widest bg-blue-600 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : `Establish Link`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PROJECTS DASHBOARD ────────────────────────────────────────────────
export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [dailyCount, setDailyCount] = useState(0)
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      // 1. Fetch Projects independently to ensure 8 nodes render
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectError) throw projectError

      // 2. Fetch memory counts to identify "Green Tick" status
      const { data: memoryData } = await supabase.from('code_memories').select('project_id')

      const formatted = (projectData || []).map(p => ({
        ...p,
        memory_count: memoryData?.filter(m => m.project_id === p.id).length || 0
      }))

      setProjects(formatted)
      setDailyCount(formatted.length) // Correctly sets "Nodes Active: 8"
    } catch (err: any) {
      console.error("Fetch Error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newProject) return; setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('projects').insert([{ name: newProject, user_id: user?.id }])
    setNewProject(''); await fetchProjects(); setIsCreating(false)
  }

  const handleSync = async (url: string, provider: string) => {
    if (!activeProjectId) return;
    setIsSyncing(activeProjectId);

    try {
      const res = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, projectId: activeProjectId, provider })
      });

      const data = await res.json();

      if (data.success) {
        // SAVE REPO URL: Vital for the Neural Edit/Push feature to work later
        await supabase
          .from('projects')
          .update({ repo_url: url })
          .eq('id', activeProjectId);

        alert(`Neural Link Established: ${data.count} blocks synced.`);
        setModalOpen(false);
        router.push(`/dashboard/projects/${activeProjectId}/doc`);
      }
    } catch (err) {
      alert("Sync Failed");
    } finally {
      setIsSyncing(null);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f1117]"><Loader2 className="animate-spin text-blue-500" size={40} /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-6">
      {/* HEADER SECTION */}
      <div className="bg-[#16181e] border border-gray-800 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">Nodes Active: {dailyCount}</p>
        </div>
        <form onSubmit={handleCreate} className="flex gap-2 w-full md:w-auto">
          <input className="flex-1 md:w-64 bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl text-xs outline-none focus:border-blue-500" placeholder="Initialize New Node..." value={newProject} onChange={(e) => setNewProject(e.target.value)} />
          <button type="submit" disabled={isCreating} className="bg-blue-600 p-4 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
          </button>
        </form>
      </div>

      {/* PROJECTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full py-24 text-center border border-dashed border-gray-800 rounded-[2.5rem] bg-[#16181e]/30">
            <p className="text-gray-600 uppercase tracking-[0.3em] font-black text-[10px]">No Nodes Found in Subspace</p>
          </div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="bg-[#16181e] border border-gray-800 p-8 rounded-[2.5rem] hover:border-blue-500/40 transition-all relative group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl transition-all ${p.memory_count > 0 ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {p.memory_count > 0 ? <CheckCircle2 size={24} /> : <Folder size={24} />}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Blocks</p>
                  <p className={`text-xl font-black italic ${p.memory_count > 0 ? 'text-green-500' : 'text-white'}`}>{p.memory_count}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-8 italic uppercase tracking-tight truncate">{p.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setActiveProjectId(p.id); setModalOpen(true); }} className="bg-[#0f1117] border border-gray-800 py-4 rounded-2xl text-[9px] font-black uppercase text-gray-500 hover:text-white transition-all tracking-widest">Sync</button>
                <Link href={`/dashboard/projects/${p.id}/doc`} className="bg-blue-600/10 border border-blue-500/20 py-4 rounded-2xl text-[9px] font-black uppercase text-blue-400 text-center hover:bg-blue-600 hover:text-white transition-all tracking-widest">Enter</Link>
              </div>
            </div>
          ))
        )}
      </div>

      <SyncModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSync={handleSync} 
        isSyncing={!!isSyncing} 
      />
    </div>
  )
}
