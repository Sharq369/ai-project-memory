'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ChevronLeft, Code2, Database, FileText, Loader2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function projectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  const [memories, setMemories] = useState<any[]>([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNodeData = async () => {
      // 1. Get Project Details
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      
      setProject(proj)

      // 2. Get Scraped Memory Blocks
      const { data: mems } = await supabase
        .from('code_memories')
        .select('*')
        .eq('project_id', id)
        .order('name', { ascending: true })

      if (mems) setMemories(mems)
      setLoading(false)
    }

    if (id) loadNodeData()
  }, [id])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0f1117]">
      <Loader2 className="animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8">
      {/* Header Navigation */}
      <button 
        onClick={() => router.push('/dashboard/projects')}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest mb-12"
      >
        <ChevronLeft size={14} /> Back to Vault
      </button>

      <div className="max-w-5xl mx-auto space-y-12">
        <div className="bg-[#16181e] border border-gray-800 p-10 rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">
              {project?.name || 'Coding'}
            </h1>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">
              Node ID: {id?.toString().slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Code2 size={120} />
          </div>
        </div>

        {/* Memory Grid: Displays the redacted code files */}
        <div className="grid grid-cols-1 gap-6">
          {memories.length > 0 ? (
            memories.map((mem) => (
              <div key={mem.id} className="bg-[#16181e] border border-gray-800 rounded-[2rem] overflow-hidden">
                <div className="bg-gray-900/50 px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest">{mem.name}</span>
                  </div>
                  <span className="text-[9px] bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-bold uppercase">
                    {mem.type}
                  </span>
                </div>
                <div className="p-8">
                  <pre className="text-gray-400 text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{mem.content}</code>
                  </pre>
                </div>
              </div>
            ))
          ) : (
            <div className="border-2 border-dashed border-gray-800 rounded-[3rem] p-20 text-center">
              <Database size={40} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em]">
                Memory Banks Empty. Run Sync in Project Vault.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
