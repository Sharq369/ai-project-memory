'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { ChevronLeft, Code2, FileText, Loader2, Sparkles } from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchProjectDetails()
  }, [id])

  async function fetchProjectDetails() {
    setLoading(true)
    try {
      // 1. Get Project Name
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)

      // 2. Get Code Blocks (The Neural Sync Data)
      const { data: mems } = await supabase
        .from('code_memories')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true })

      setMemories(mems || [])
    } catch (err) {
      console.error("Doc Fetch Error")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0f1117]">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/dashboard/projects')}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> Back to Vault
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
          <Sparkles size={14} className="text-green-500" />
          <span className="text-[10px] font-black text-green-500 uppercase tracking-tight">Neural Link Active</span>
        </div>
      </div>

      {/* Project Title */}
      <div className="bg-[#16181e] border border-gray-800 p-10 rounded-[2.5rem] shadow-2xl">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
          {project?.name || 'Loading Node...'}
        </h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">
          Project Memory ID: <span className="text-blue-500">{id?.slice(0, 8)}</span>
        </p>
      </div>

      {/* Code Blocks Area */}
      <div className="space-y-6">
        {memories.length === 0 ? (
          <div className="bg-[#16181e] border border-dashed border-gray-800 p-20 rounded-[2.5rem] text-center">
            <p className="text-gray-600 font-black uppercase tracking-widest text-xs">No Code Memories Synced Yet</p>
          </div>
        ) : (
          memories.map((block, idx) => (
            <div key={block.id} className="bg-[#16181e] border border-gray-800 rounded-[2rem] overflow-hidden shadow-xl">
              <div className="bg-[#1c1f26] px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Code2 size={16} className="text-blue-500" />
                  <span className="text-xs font-mono text-gray-300">{block.file_path || `Block_${idx + 1}`}</span>
                </div>
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                  {block.status}
                </span>
              </div>
              <div className="p-8">
                <pre className="text-xs font-mono text-blue-100 leading-relaxed overflow-x-auto">
                  <code>{block.content}</code>
                </pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
