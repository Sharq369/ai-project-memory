'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Code2, Edit3, X, Github, Loader2 } from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const [memories, setMemories] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getDocs() {
      const { data } = await supabase.from('code_memories').select('*').eq('project_id', id)
      setMemories(data || [])
      setLoading(false)
    }
    if (id) getDocs()
  }, [id])

  const saveChange = async (block: any) => {
    // Points to your actual file at app/api/github/push/route.ts
    await fetch('/api/github/push', {
      method: 'POST',
      body: JSON.stringify({ path: block.file_path, content: editContent, projectId: id })
    })
    setEditingId(null)
    window.location.reload()
  }

  if (loading) return <div className="h-screen bg-[#0f1117] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="p-4 bg-[#0f1117] min-h-screen text-white">
      <h1 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">Memory AI</h1>
      
      <div className="space-y-4">
        {memories.length === 0 ? <p className="text-gray-600 text-[10px] uppercase">No Data Found</p> : memories.map(block => (
          <div key={block.id} className="bg-[#16181e] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <span className="text-[10px] font-mono text-blue-500 uppercase">{block.file_path}</span>
              <button onClick={() => { setEditingId(block.id); setEditContent(block.content); }}>
                {editingId === block.id ? <X size={14}/> : <Edit3 size={14}/>}
              </button>
            </div>
            
            <div className="p-4">
              {editingId === block.id ? (
                <div className="space-y-4">
                  <textarea 
                    className="w-full h-64 bg-black text-xs font-mono p-2 border border-blue-500/30 rounded" 
                    value={editContent} 
                    onChange={e => setEditContent(e.target.value)} 
                  />
                  <button onClick={() => saveChange(block)} className="w-full bg-blue-600 py-2 text-[10px] font-black uppercase flex items-center justify-center gap-2">
                    <Github size={12}/> Push to GitHub
                  </button>
                </div>
              ) : (
                <pre className="text-[10px] font-mono text-gray-400 overflow-x-auto"><code>{block.content}</code></pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
