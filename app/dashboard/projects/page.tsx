'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Globe, Zap, Loader2, RefreshCw, Pencil, X, Trash2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [repoUrl, setRepoUrl] = useState('')
  const [editName, setEditName] = useState('')
  const [provider, setProvider] = useState('github') 
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchProjects = async () => {
    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (projectData) {
      const projectsWithCounts = await Promise.all(projectData.map(async (p) => {
        const { count } = await supabase
          .from('code_memories')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', p.id)
        return { ...p, blockCount: count || 0 }
      }))
      setProjects(projectsWithCounts)
    }
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  const handleSync = async (e?: React.MouseEvent, manualProject?: any) => {
    if (e) e.stopPropagation();
    const targetProject = manualProject || selectedProject;
    const targetUrl = manualProject ? manualProject.repo_url : repoUrl;
    
    if (!targetUrl || !targetProject) return;
    setIsSyncing(true);
    
    try {
      const res = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoUrl: targetUrl, 
          projectId: targetProject.id, 
          provider: manualProject ? manualProject.provider : provider 
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setShowSyncModal(false);
        await fetchProjects(); 
      } else {
        alert(`Sync Error: ${data.error}`);
      }
    } catch (e) {
      alert("Neural Link Timeout.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject || !editName) return;
    const { error } = await supabase
      .from('projects')
      .update({ name: editName })
      .eq('id', selectedProject.id);

    if (!error) {
      setShowEditModal(false);
      fetchProjects();
    }
  };

  // New: Delete Functionality
  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    const confirmDelete = confirm(`Permanently delete "${selectedProject.name}"? All memory blocks will be lost.`);
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', selectedProject.id);

    if (!error) {
      setShowEditModal(false);
      fetchProjects();
    } else {
      alert("Error deleting node: " + error.message);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0f1117]">
      <Loader2 className="animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 min-h-screen bg-[#0f1117]">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Project Vault</h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Nodes active: {projects.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#16181e] border border-gray-800 p-8 rounded-[2.5rem] relative group">
            <div className="absolute top-6 right-8 flex items-center gap-4">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setSelectedProject(project); 
                  setEditName(project.name);
                  setShowEditModal(true); 
                }}
                className="text-gray-600 hover:text-blue-500 transition-colors"
              >
                <Pencil size={16} />
              </button>
              
              <button 
                disabled={isSyncing} 
                onClick={(e) => handleSync(e, project)} 
                className="text-gray-600 hover:text-white transition-colors"
              >
                <RefreshCw size={18} className={isSyncing ? "animate-spin text-blue-500" : ""} />
              </button>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500"><Globe size={20} /></div>
            </div>
            
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">{project.name}</h3>
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest mb-1">
              {project.blockCount} Memory Blocks Retrieved
            </p>
            <p className="text-gray-600 text-[7px] font-bold uppercase tracking-widest mb-8">
              Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Pending'}
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-1 bg-[#0f1117] border border-gray-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800">Enter Node</button>
              <button onClick={() => { setSelectedProject(project); setShowSyncModal(true); }} className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-500 shadow-lg shadow-blue-900/20">
                <Zap size={16} fill="white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit & Delete Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#16181e] border border-gray-800 w-full max-w-md rounded-[3rem] p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter">Edit Node</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Node Alias</label>
              <input 
                className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-blue-500" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
              />
              <button onClick={handleUpdateProject} className="w-full bg-blue-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-blue-500">
                Update Metadata
              </button>
            </div>

            <div className="pt-6 border-t border-gray-800/50">
              <p className="text-[9px] font-black uppercase text-red-500/50 tracking-widest mb-4">Danger Zone</p>
              <button 
                onClick={handleDeleteProject}
                className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Decommission Node
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ... (Sync Modal remains the same) */}
    </div>
  )
}
