'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { ChevronLeft, Code2, Loader2, Sparkles, Search, Edit3, Save, Github, X, RefreshCw } from 'lucide-react'

export default function ProjectDocPage() {
  const params = useParams()
  const id = params?.id as string // Ensure ID is treated as a string
  const router = useRouter()
  
  const [project, setProject] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isPushing, setIsPushing] = useState(false)

  useEffect(() => { if (id) fetchDetails() }, [id])

  async function fetchDetails() {
    setLoading(true)
    try {
      // 1. Fetch Project Metadata
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)

      // 2. Fetch Code Blocks for this Project ID
      const { data: mems, error } = await supabase
        .from('code_memories')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMemories(mems || [])
    } catch (err) {
      console.error("Fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }

  // Resilient Search: Prevents crashes if file_path or content is NULL
  const filteredMemories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return memories

    return memories.filter(m => {
      const pathMatch = (m.file_path || '').toLowerCase().includes(q)
      const contentMatch = (m.content || '').toLowerCase().includes(q)
      return pathMatch || contentMatch
    })
  }, [searchQuery, memories])

  const handlePush = async (block: any) => {
    if (!project?.repo_url) return alert("Missing Repo URL")
    setIsPushing(true)
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: block.file_path || `update_${block.id}.txt`,
          content: editContent,
          repoUrl: project.repo_url,
          projectId: id
        })
      })
      if ((await res.json()).success) {
        setEditingId(null)
        await fetchDetails()
      }
    } finally { setIsPushing(false) }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0f1117]">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      {/* ─── HEADER & NEURAL SEARCH ─── */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest">
          <ChevronLeft size={16} /> Back
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
          <button onClick={fetchDetails} className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="bg-[#16181e] border border-gray-800 p-10 rounded-[2.5rem] shadow-2xl">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">{project?.name || 'Node Offline'}</h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Node ID: <span className="text-blue-500">{String(id).slice(0, 8)}</span></p>
      </div>

      {/* ─── CONTENT AREA ─── */}
      <div className="space-y-6">
        {memories.length === 0 ? (
          // Case 1: Database actually returned nothing for this Project ID
          <div className="text-center py-24 bg-[#16181e]/30 border border-dashed border-gray-800 rounded-[3rem]">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">No memories found in this node</p>
            <button onClick={() => router.push('/dashboard/projects')} className="text-blue-500 text-[9px] font-black uppercase tracking-widest hover:underline">Re-Sync from Vault</button>
          </div>
        ) : filteredMemories.length === 0 ? (
          // Case 2: Data exists, but search is filtering it all out
          <div className="text-center py-24 bg-[#16181e]/30 border border-dashed border-gray-800 rounded-[3rem]">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">No matching memories for "{searchQuery}"</p>
          </div>
        ) : (
          filteredMemories.map((block, idx) => {
            const isEditing = editingId === block.id;
            return (
              <div key={block.id} className={`bg-[#16181e] border rounded-[2rem] overflow-hidden transition-all duration-300 ${isEditing ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-800'}`}>
                <div className="bg-[#1c1f26] px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Code2 size={16} className="text-blue-500" />
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">{block.file_path || `SOURCE_BLOCK_${idx + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${block.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>{block.status || 'PENDING'}</span>
                    <button onClick={() => { setEditingId(isEditing ? null : block.id); setEditContent(block.content); }} className="text-gray-500 hover:text-white"><Edit3 size={14} /></button>
                  </div>
                </div>
                <div className="p-8 bg-[#0f1117]">
                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea className="w-full h-80 bg-transparent text-[11px] font-mono text-blue-100 outline-none resize-none p-4 rounded-xl border border-blue-500/20 focus:border-blue-500" value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus />
                      <div className="flex justify-end"><button onClick={() => handlePush(block)} disabled={isPushing} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">{isPushing ? <Loader2 size={12} className="animate-spin" /> : <><Github size={12}/> Push Update</>}</button></div>
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
