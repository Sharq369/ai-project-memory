'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Brain, Plus, Loader2, Layers, Trash2, AlertTriangle, Search, Filter } from 'lucide-react'

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Power Upgrade States
  const [localSearch, setLocalSearch] = useState('')

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

  const confirmDeleteMemory = async () => {
    if (!memoryToDelete) return
    setIsDeleting(true)

    const { error } = await supabase.from('memories').delete().eq('id', memoryToDelete.id)

    if (!error) {
      setMemories(prev => prev.filter(m => m.id !== memoryToDelete.id))
    }
    
    setIsDeleting(false)
    setMemoryToDelete(null)
  }

  // Local Filter Logic
  const filteredMemories = memories.filter(m => 
    m.content.toLowerCase().includes(localSearch.toLowerCase()) || 
    m.projects?.name?.toLowerCase().includes(localSearch.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      
      {/* FORM: Add Memory */}
      <div className="bg-[#16181e] border border-gray-800 rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <Layers className="text-blue-500" size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white">Inject Knowledge</h2>
        </div>
        
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste code snippets, architecture rules, or terminal commands..."
          className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl p-5 text-sm text-gray-300 outline-none focus:border-blue-500 min-h-[120px] transition-all font-mono"
        />

        <div className="flex flex-col md:flex-row gap-4">
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1 bg-[#0f1117] border border-gray-800 rounded-xl px-5 py-4 text-xs font-bold text-gray-500 outline-none cursor-pointer hover:border-gray-700 transition-colors"
          >
            <option value="">-- Associate with Project --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          
          <button 
            onClick={handleAddMemory}
            disabled={isSaving || !content || !selectedProject}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} 
            Sync Memory
          </button>
        </div>
      </div>

      {/* POWER UPGRADE: Local Search Bar */}
      <div className="flex items-center bg-[#16181e] border border-gray-800 rounded-2xl px-4 py-3 gap-3">
        <Search size={16} className="text-gray-500" />
        <input 
          type="text"
          placeholder="Filter memories instantly..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600"
        />
        <Filter size={16} className="text-gray-600" />
      </div>

      {/* LIST: Memory Feed */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMemories.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-gray-800 rounded-2xl">
            No memories match your search.
          </div>
        )}

        {filteredMemories.map((m) => (
          <div key={m.id} className="bg-[#16181e]/50 border border-gray-800/50 p-6 rounded-2xl flex justify-between items-start group hover:bg-[#16181e] transition-all">
            <div className="space-y-3 max-w-[85%]">
              <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-md uppercase tracking-tighter border border-blue-500/20">
                {m.projects?.name || "Unassigned"}
              </span>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-[#0f1117] p-4 rounded-xl border border-gray-800/50">
                {m.content}
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-2 pt-1">
              <Brain className="text-gray-700 group-hover:text-purple-500 transition-colors mb-2" size={20} />
              
              <button 
                onClick={() => setMemoryToDelete({ id: m.id, content: m.content })}
                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Delete Memory"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DELETE MODAL */}
      {memoryToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-red-900/30 w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Memory?</h2>
              <div className="p-3 bg-black/50 border border-gray-800 rounded-lg mt-4">
                <p className="text-xs text-gray-500 truncate italic">"{memoryToDelete.content}"</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setMemoryToDelete(null)} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#161b22] text-gray-300">Cancel</button>
              <button onClick={confirmDeleteMemory} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-600 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
