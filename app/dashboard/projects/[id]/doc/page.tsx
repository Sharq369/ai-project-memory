'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { ChevronLeft, Code2, Loader2, Search, Edit3, X, Github, RefreshCw } from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Neural Edit States
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isPushing, setIsPushing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { if (id) fetchDetails() }, [id])

  async function fetchDetails() {
    setLoading(true)
    try {
      // Fetch both project and its memories
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      const { data: mems } = await supabase.from('code_memories').select('*').eq('project_id', id).order('created_at', { ascending: true })
      
      setProject(proj)
      setMemories(mems || [])
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePush = async (block: any) => {
    setIsPushing(true)
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: block.file_path || 'file.txt',
          content: editContent,
          repoUrl: project.repo_url,
          projectId: id
        })
      })
      if (res.ok) {
        setEditingId(null)
        fetchDetails()
      }
    } finally {
      setIsPushing(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f1117]"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      {/* ─── NAVIGATION ─── */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest">
          <ChevronLeft size={16} /> BACK
        </button>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              className="bg-[#16181e] border border-gray-800 rounded-full pl-10 pr-4 py-2 text-[10px] text-white outline-none w-48 focus:border-blue-500"
              placeholder="NEURAL SEARCH..."
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            />
          </div>
          <button onClick={fetchDetails} className="text-gray-500 hover:text-blue-500"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* ─── TITLE CARD ─── */}
      <div className="bg-[#16181e] border border-gray-800 p-10 rounded-[2.5rem]">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">{project?.name || 'NODE'}</h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">NODE ID: <span className="text-blue-500">{String(id).slice(0, 8)}</span></p>
      </div>

      {/* ─── MEMORY BLOCKS ─── */}
      <div className="space-y-6">
        {memories.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-[2rem]">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Database Empty. Please run Neural Sync.</p>
          </div>
        ) : (
          memories.filter(m => (m.content || '').toLowerCase().includes(searchQuery)).map((block, idx) => {
            const isEditing = editingId === block.id
            return (
              <div key={block.id} className={`bg-[#16181e] border rounded-[2rem] overflow-hidden ${isEditing ? 'border-blue-500' : 'border-gray-800'}`}>
                <div className="bg-[#1c1f26] px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Code2 size={16} className="text-blue-500" />
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">{block.file_path || `BLOCK_${idx + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase text-green-500">{block.status || 'COMPLETED'}</span>
                    <button onClick={() => { setEditingId(isEditing ? null : block.id); setEditContent(block.content); }} className="text-gray-500 hover:text-white">
                      {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-[#0f1117]">
                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea 
                        className="w-full h-80 bg-transparent text-[11px] font-mono text-blue-100 outline-none resize-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <button onClick={() => handlePush(block)} className="bg-blue-600 text-white px-4 py-2 rounded text-[10px] font-bold flex items-center gap-2 ml-auto">
                        {isPushing ? <Loader2 size={12} className="animate-spin" /> : <><Github size={12}/> PUSH</>}
                      </button>
                    </div>
                  ) : (
                    <pre className="text-[11px] font-mono text-blue-100 leading-relaxed overflow-x-auto"><code>{block.content}</code></pre>
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
