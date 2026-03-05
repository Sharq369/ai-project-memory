'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Brain, Plus, Loader2, Database, Layers, Trash2, AlertTriangle } from 'lucide-react'

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // --- PREMIUM DELETE STATE ---
  const [memoryToDelete, setMemoryToDelete] = useState<{ id: string, content: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [mRes, pRes] = await Promise.all([
        supabase.from('memories').select(`*, projects(name)`).order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name')
      ])
      if (mRes.data) setMemories(mRes.data)
      if (pRes.data) setProjects(pRes.data)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleAddMemory = async () => {
    if (!content || !selectedProject) return
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('memories').insert([{
      content,
      project_id: selectedProject,
      user_id: user?.id
    }])
    if (!error) { 
      setContent(''); 
      window.location.reload(); 
    }
    setIsSaving(false)
  }

  // --- DELETE LOGIC ---
  const confirmDeleteMemory = async () => {
    if (!memoryToDelete) return
    setIsDeleting(true)

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryToDelete.id)

    if (!error) {
      setMemories(prev => prev.filter(m => m.id !== memoryToDelete.id))
    } else {
      console.error("Delete Error:", error.message)
      alert(`Failed to delete memory: ${error.message}`)
    }
    
    setIsDeleting(false)
    setMemoryToDelete(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* FORM: Add Memory */}
      <div className="bg-[#16181e] border border-gray-800 rounded-[2.5rem] p-10 space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="text-blue-500" size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white">Inject Knowledge</h2>
        </div>
        
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your manual memory block here..."
          className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl p-5 text-sm text-gray-300 outline-none focus:border-blue-500 min-h-[120px] transition-all"
        />

        <div className="flex flex-col md:flex-row gap-4">
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1 bg-[#0f1117] border border-gray-800 rounded-xl px-5 py-4 text-xs font-bold text-gray-500 outline-none appearance-none cursor-pointer"
          >
            <option value="">-- Associate with Project --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          
          <button 
            onClick={handleAddMemory}
            disabled={isSaving || !content || !selectedProject}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} 
            Sync Memory
          </button>
        </div>
      </div>

      {/* LIST: Memory Feed */}
      <div className="grid grid-cols-1 gap-4">
        {memories.map((m) => (
          <div key={m.id} className="bg-[#16181e]/50 border border-gray-800/50 p-6 rounded-2xl flex justify-between items-center group hover:bg-[#16181e] transition-all">
            <div className="space-y-2 max-w-[85%]">
              <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                {m.projects?.name || "Unassigned"}
              </span>
              <p className="text-gray-400 text-sm leading-relaxed">{m.content}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Brain className="text-gray-800 group-hover:text-blue-500 transition-colors" size={24} />
              
              {/* DELETE BUTTON */}
              <button 
                onClick={() => setMemoryToDelete({ id: m.id, content: m.content })}
                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Delete Memory"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PREMIUM CUSTOM CONFIRMATION MODAL */}
      {memoryToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="bg-[#0e1117] border border-red-900/30 w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl scale-in-95">
            
            <div className="p-6 md:p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Delete Memory?</h2>
              <p className="text-sm text-gray-400 mb-2">
                You are about to permanently delete this manual memory block.
              </p>
              <div className="p-3 bg-black/50 border border-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 truncate italic">"{memoryToDelete.content}"</p>
              </div>
            </div>

            <div className="flex gap-3 px-6 md:px-8 pb-6 md:pb-8">
              <button 
                onClick={() => setMemoryToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#161b22] hover:bg-gray-800 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteMemory}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}
