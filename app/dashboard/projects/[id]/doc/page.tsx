'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { ChevronLeft, Code2, Loader2, Sparkles, Search, Edit3, Github } from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // States for Search and Edit
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isPushing, setIsPushing] = useState(false)

  useEffect(() => { if (id) fetchDetails() }, [id])

  async function fetchDetails() {
    setLoading(true)
    const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
    const { data: mems } = await supabase.from('code_memories').select('*').eq('project_id', id)
    setProject(proj)
    setMemories(mems || [])
    setLoading(false)
  }

  const filteredMemories = memories.filter(m => 
    m.file_path?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePush = async (block: any) => {
    setIsPushing(true)
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: block.file_path,
          content: editContent,
          repoUrl: project.repo_url,
          projectId: id
        })
      })
      if (res.ok) {
        setEditingId(null)
        await fetchDetails()
      }
    } finally { setIsPushing(false) }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f1117]"><Loader2 className="animate-spin text-blue-500" size={40} /></div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <button onClick={() => router.push('/dashboard/projects')} className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <ChevronLeft size={14} /> Back to Vault
        </button>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              className="bg-[#16181e] border border-gray-800 rounded-full pl-10 pr-4 py-2 text-[10px] text-white outline-none w-48 focus:w-64 transition-all"
              placeholder="NEURAL SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <Sparkles size={12} className="text-green-500" />
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Neural Link Active</span>
          </div>
        </div>
      </div>

      <div className="bg-[#16181e] border border-gray-800 p-10 rounded-[2.5rem]">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">{project?.name}</h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Node ID: <span className="text-blue-500">{String(id).slice(0, 8)}</span></p>
      </div>

      <div className="space-y-6">
        {filteredMemories.map((block) => (
          <div key={block.id} className="bg-[#16181e] border border-gray-800 rounded-[2rem] overflow-hidden">
            <div className="bg-[#1c1f26] px-8 py-4 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Code2 size={16} className="text-blue-500" />
                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">{block.file_path}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{block.status}</span>
                {editingId === block.id ? (
                  <button onClick={() => handlePush(block)} className="bg-blue-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase flex items-center gap-2">
                    {isPushing ? <Loader2 size={10} className="animate-spin" /> : <><Github size={12} /> Push Update</>}
                  </button>
                ) : (
                  <button onClick={() => { setEditingId(block.id); setEditContent(block.content); }} className="text-gray-500 hover:text-white"><Edit3 size={14} /></button>
                )}
              </div>
            </div>
            <div className="p-8 bg-[#0f1117]">
              {editingId === block.id ? (
                <textarea className="w-full h-64 bg-transparent text-[11px] font-mono text-blue-100 outline-none resize-none" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              ) : (
                <pre className="text-[11px] font-mono text-blue-100 overflow-x-auto"><code>{block.content}</code></pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
