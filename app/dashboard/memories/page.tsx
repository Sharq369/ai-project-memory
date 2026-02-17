'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Database, Plus, Loader2, Trash2, 
  Tag as TagIcon, Calendar, Hash, AlertCircle, Folder 
} from 'lucide-react'

export default function MemoriesPage() {
  const [content, setContent] = useState('')
  const [selectedProject, setSelectedProject] = useState('none')
  const [projects, setProjects] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Fetch Memories AND Projects on load
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Run both fetches in parallel for speed
    const [memoriesRes, projectsRes] = await Promise.all([
      supabase.from('memories').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('name')
    ])

    if (memoriesRes.data) setMemories(memoriesRes.data)
    if (projectsRes.data) setProjects(projectsRes.data)
    setLoading(false)
  }

  const getAutoTag = (text: string) => {
    const input = text.toLowerCase()
    if (input.includes('api') || input.includes('code') || input.includes('fix')) return 'DEVELOPMENT'
    if (input.includes('ui') || input.includes('design') || input.includes('color')) return 'DESIGN'
    if (input.includes('saas') || input.includes('market') || input.includes('plan')) return 'BUSINESS'
    return 'OBSERVATION'
  }

  // 2. The FIXED Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSaving) return

    setIsSaving(true)

    try {
      // A. Get current user explicitly to prevent "Guest" errors
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert("Error: You are not logged in.")
        setIsSaving(false)
        return
      }

      const tag = getAutoTag(content)

      // B. Insert with explicit user_id and project_id
      const { data, error } = await supabase
        .from('memories')
        .insert([{ 
          content, 
          tag,
          user_id: user.id, // Explicitly linking the user fixes RLS errors
          project_id: selectedProject === 'none' ? null : selectedProject
        }])
        .select()

      if (error) {
        // C. If it fails, this alert will tell us EXACTLY why (e.g., "Violates foreign key...")
        alert("Database Error: " + error.message)
      } else if (data) {
        setMemories([data[0], ...memories])
        setContent('')
        // Optional: Reset project selection after save? 
        // setSelectedProject('none') 
      }
    } catch (err: any) {
      alert("System Error: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteMemory = async (id: string) => {
    if (!confirm("Delete this memory?")) return
    const { error } = await supabase.from('memories').delete().eq('id', id)
    if (!error) setMemories(memories.filter(m => m.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* Input Section */}
      <section className="bg-[#16181e] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <Database className="text-blue-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Record Memory</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <textarea
            className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl p-5 text-gray-200 outline-none focus:border-blue-500/50 transition-all min-h-[120px] resize-none text-lg placeholder:text-gray-600"
            placeholder="What's on your mind? AI will auto-categorize your entry..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <div className="flex flex-col md:flex-row justify-between gap-4">
            
            {/* Project Selector (New Feature) */}
            <div className="flex items-center gap-2 bg-[#0f1117] px-3 py-2 rounded-xl border border-gray-800">
              <Folder size={14} className="text-gray-500" />
              <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-transparent text-sm text-gray-300 outline-none w-full md:w-auto"
              >
                <option value="none">No Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="hidden md:flex text-[10px] text-gray-600 font-bold uppercase tracking-widest items-center gap-2">
                <AlertCircle size={12} /> Auto-tagging active
              </p>
              <button
                type="submit"
                disabled={isSaving || !content.trim()}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                SAVE ENTRY
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* List Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] px-2">Recent Archives</h3>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-700" /></div>
        ) : (
          <div className="grid gap-4">
            {memories.map((m) => (
              <div key={m.id} className="group bg-[#16181e] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition-all flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex gap-3 items-center flex-wrap">
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded border border-blue-500/20 flex items-center gap-1.5">
                      <Hash size={10} /> {m.tag}
                    </span>
                    {/* Only show project badge if linked */}
                    {projects.find(p => p.id === m.project_id) && (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 flex items-center gap-1.5">
                        <Folder size={10} /> {projects.find(p => p.id === m.project_id)?.name}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600 flex items-center gap-1.5 font-medium uppercase">
                      <Calendar size={12} /> {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{m.content}</p>
                </div>
                <button 
                  onClick={() => deleteMemory(m.id)}
                  className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-gray-700 hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
