'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { ChevronLeft, Code2, Loader2, Sparkles, Search, Edit3, Save, Github, X } from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Feature States
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isPushing, setIsPushing] = useState(false)

  useEffect(() => { if (id) fetchDetails() }, [id])

  async function fetchDetails() {
    setLoading(true)
    const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
    const { data: mems } = await supabase.from('code_memories').select('*').eq('project_id', id).order('created_at', { ascending: true })
    setProject(proj)
    setMemories(mems || [])
    setLoading(false)
  }

  // Neural Search logic
  const filteredMemories = memories.filter(m => 
    m.file_path?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Push to GitHub function
  const handlePush = async (block: any) => {
    if (!project?.repo_url) {
      alert("No Repository URL found for this project node.")
      return
    }
    
    setIsPushing(true)
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: block.file_path || `block_${block.id}.txt`,
          content: editContent,
          repoUrl: project.repo_url,
          projectId: id
        })
      })

      const data = await res.json()
      if (data.success) {
        setEditingId(null)
        await fetchDetails()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      alert("Push failed. Check connection.")
    } finally {
      setIsPushing(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0f1117]">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      {/* ─── NAVIGATION & SEARCH ─── */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/dashboard/projects')} 
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> Back to Vault
        </button>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              className="bg-[#16181e] border border-gray-800 rounded-full pl-10 pr-4 py-2 text-[10px] text-white outline-none focus:border-blue-500 w-48 focus:w-64 transition-all"
              placeholder="NEURAL SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <Sparkles size={14} className="text-green-500" />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Neural Link Active</span>
          </div>
        </div>
      </div>

      {/* ─── PROJECT HEADER ─── */}
      <div className="bg-[#16181e] border border-gray-800 p-10 rounded-[2.5rem] shadow-2xl">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">{project?.name}</h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Node ID: <span className="text-blue-500">{String(id).slice(0, 8)}</span></p>
      </div>

      {/* ─── CODE BLOCKS ─── */}
      <div className="space-y-6">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-20 bg-[#16181e]/30 border border-dashed border-gray-800 rounded-[2rem]">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">No matching memories found</p>
          </div>
        ) : (
          filteredMemories.map((block, idx) => {
            const isEditing = editingId === block.id;
            return (
              <div key={block.id} className={`bg-[#16181e] border rounded-[2rem] overflow-hidden transition-all duration-300 ${isEditing ? 'border-blue-500 ring-1 ring-blue-500/20 shadow-2xl' : 'border-gray-800'}`}>
                
                {/* Block Header */}
                <div className="bg-[#1c1f26] px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Code2 size={16} className="text-blue-500" />
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                      {block.file_path || `SOURCE_BLOCK_${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${block.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {block.status || 'PENDING'}
                    </span>
                    <button 
                      onClick={() => {
                        if (isEditing) {
                          setEditingId(null)
                        } else {
                          setEditingId(block.id)
                          setEditContent(block.content)
                        }
                      }}
                      className="text-gray-500 hover:text-white transition-colors p-1"
                    >
                      {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Block Body: Conditional Input or Code */}
                <div className="p-8 bg-[#0f1117]">
                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea 
                        className="w-full h-80 bg-transparent text-[11px] font-mono text-blue-100 leading-relaxed outline-none resize-none p-4 rounded-xl border border-blue-500/20 focus:border-blue-500 transition-all"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={() => handlePush(block)}
                          disabled={isPushing}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"
                        >
                          {isPushing ? <Loader2 size={12} className="animate-spin" /> : <><Github size={12}/> Push Update</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre className="text-[11px] font-mono text-blue-100 leading-relaxed overflow-x-auto">
                      <code>{block.content}</code>
                    </pre>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
