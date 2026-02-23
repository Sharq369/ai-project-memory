'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ChevronLeft, Code2, Loader2, Edit3, X, Github } from 'lucide-react'

// DIRECT INITIALIZATION - DO NOT ADD ANY IMPORTS FROM '@/lib'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [project, setProject] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isPushing, setIsPushing] = useState(false)

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return
      setLoading(true)
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      const { data: mems } = await supabase.from('code_memories').select('*').eq('project_id', id)
      setProject(proj)
      setMemories(mems || [])
      setLoading(false)
    }
    fetchDetails()
  }, [id])

  const handlePush = async (block: any) => {
    setIsPushing(true)
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: block.file_path, 
          content: editContent, 
          repoUrl: project?.repo_url, 
          projectId: id 
        })
      })
      if (res.ok) { 
        setEditingId(null)
        window.location.reload()
      }
    } finally { setIsPushing(false) }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0f1117]">
      <Loader2 className="animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 min-h-screen bg-[#0f1117] pb-32">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest"
      >
        <ChevronLeft size={16} /> BACK TO VAULT
      </button>

      <div className="bg-[#16181e] border border-gray-800 p-10 rounded-[2.5rem]">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
          {project?.name || 'NODE'}
        </h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">
          NODE ID: <span className="text-blue-500">{String(id).slice(0, 8)}</span>
        </p>
      </div>

      <div className="space-y-6">
        {memories.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-[2rem]">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">
              Memory Banks Empty. Run Sync in Project Vault.
            </p>
          </div>
        ) : (
          memories.map((block) => (
            <div key={block.id} className="bg-[#16181e] border border-gray-800 rounded-[2rem] overflow-hidden">
              <div className="bg-[#1c1f26] px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Code2 size={16} className="text-blue-500" />
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                    {block.file_path}
                  </span>
                </div>
                <button 
                  onClick={() => { 
                    setEditingId(editingId === block.id ? null : block.id)
                    setEditContent(block.content)
                  }} 
                  className="text-gray-500 hover:text-white"
                >
                  {editingId === block.id ? <X size={16} /> : <Edit3 size={16} />}
                </button>
              </div>

              <div className="p-8">
                {editingId === block.id ? (
                  <div className="space-y-4">
                    <textarea 
                      className="w-full h-96 bg-[#0f1117] text-[11px] font-mono text-blue-100 outline-none resize-none border border-blue-500/20 p-4 rounded-xl focus:border-blue-500"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <button 
                      onClick={() => handlePush(block)} 
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 ml-auto"
                    >
                      {isPushing ? <Loader2 size={12} className="animate-spin" /> : <><Github size={12}/> PUSH TO SOURCE</>}
                    </button>
                  </div>
                ) : (
                  <pre className="text-[11px] font-mono text-blue-100 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    <code>{block.content}</code>
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
