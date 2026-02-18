'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Brain, Plus, Loader2, Database, Layers } from 'lucide-react'

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
    if (!error) { setContent(''); window.location.reload(); }
    setIsSaving(false)
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
            <div className="space-y-2">
              <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                {m.projects?.name}
              </span>
              <p className="text-gray-400 text-sm leading-relaxed">{m.content}</p>
            </div>
            <Brain className="text-gray-800 group-hover:text-blue-500 transition-colors" size={24} />
          </div>
        ))}
      </div>
    </div>
  )
}
