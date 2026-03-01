'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Star, Zap, Search, Loader2, X, Plus, Pencil, Trash2, Check } from 'lucide-react'

export default function ProjectVault() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals State
  const [isNewNodeOpen, setIsNewNodeOpen] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setProjects(data)
    setLoading(false)
  }

  const handleCreateNode = async () => {
    if (!newNodeName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Please log in.")

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: newNodeName, user_id: user.id, preferred_platform: 'Vercel' }])
      .select()
    
    if (!error && data) {
      setProjects([data[0], ...projects])
      setNewNodeName('')
      setIsNewNodeOpen(false)
    }
  }

  // --- NEW: UPDATE LOGIC ---
  const handleUpdateProject = async () => {
    if (!editName.trim() || editName === editingProject.name) {
      setIsEditModalOpen(false)
      return
    }

    const { error } = await supabase
      .from('projects')
      .update({ name: editName })
      .eq('id', editingProject.id)

    if (error) {
      alert("Update failed: " + error.message)
    } else {
      setProjects(projects.map(p => p.id === editingProject.id ? { ...p, name: editName } : p))
      setIsEditModalOpen(false)
    }
  }

  // --- NEW: DELETE LOGIC ---
  const handleDeleteProject = async () => {
    const confirmDelete = window.confirm(`Permanently decommission node: ${editingProject.name}?`)
    if (!confirmDelete) return

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', editingProject.id)

    if (error) {
      alert("Deletion failed: " + error.message)
    } else {
      setProjects(projects.filter(p => p.id !== editingProject.id))
      setIsEditModalOpen(false)
    }
  }

  if (loading) return <div className="h-screen bg-[#0a0b0e] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-7xl mx-auto p-12 min-h-screen bg-[#0a0b0e] text-white">
      <header className="mb-12 flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-none">PROJECT VAULT</h1>
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] mt-4">
              NEURAL NODES ACTIVE: {projects.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="SEARCH NODES..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111319] border border-gray-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 w-64 transition-all"
            />
            <button onClick={() => setIsNewNodeOpen(true)} className="bg-blue-600 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2">
              <Plus size={14} /> New Node
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((project) => (
          <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] p-10 hover:border-blue-600/40 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <h3 className="text-2xl font-black italic uppercase truncate pr-4">{project.name}</h3>
              <div className="flex gap-2">
                {/* NEW PENCIL EDIT BUTTON */}
                <button 
                  onClick={() => {
                    setEditingProject(project)
                    setEditName(project.name)
                    setIsEditModalOpen(true)
                  }}
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <Star size={14} className="text-gray-800 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-1 bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                Enter Node
              </button>
              <button className="bg-blue-600 p-4 rounded-xl hover:scale-105 transition-all">
                <Zap size={18} fill="white" stroke="none" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isNewNodeOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative shadow-2xl">
            <button onClick={() => setIsNewNodeOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white"><X size={18}/></button>
            <h2 className="text-xl font-black italic uppercase mb-8">INITIALIZE NODE</h2>
            <input 
              autoFocus
              value={newNodeName} 
              onChange={(e) => setNewNodeName(e.target.value)} 
              className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 mb-6"
            />
            <button onClick={handleCreateNode} className="w-full bg-blue-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">CREATE</button>
          </div>
        </div>
      )}

      {/* EDIT/DELETE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative shadow-2xl">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white"><X size={18}/></button>
            <h2 className="text-xl font-black italic uppercase mb-8">MANAGE NODE</h2>
            
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Rename Project</p>
            <input 
              autoFocus
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 mb-6"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteProject} 
                className="flex-1 bg-red-900/20 border border-red-900/40 py-4 rounded-xl text-[9px] font-black uppercase text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> DEPLOY DELETE
              </button>
              <button 
                onClick={handleUpdateProject} 
                className="flex-1 bg-blue-600 py-4 rounded-xl text-[9px] font-black uppercase text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
              >
                <Check size={14} /> SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
