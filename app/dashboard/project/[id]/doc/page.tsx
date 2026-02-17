'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { 
  BookOpen, ListTree, ChevronRight, 
  FileText, Code2, Sparkles, Terminal 
} from 'lucide-react'

export default function ProjectDocPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [pRes, mRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', params.id).single(),
        supabase.from('memories')
          .select('*')
          .eq('project_id', params.id)
          .order('created_at', { ascending: true })
      ])
      if (pRes.data) setProject(pRes.data)
      if (mRes.data) setMemories(mRes.data)
      setLoading(false)
    }
    loadData()
  }, [params.id])

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-500">Compiling Documentation...</div>

  return (
    <div className="max-w-5xl mx-auto min-h-screen flex flex-col md:flex-row gap-12 py-12 px-6">
      
      {/* 1. Sticky Navigation Sidebar */}
      <aside className="md:w-64 shrink-0 hidden md:block">
        <div className="sticky top-12 space-y-8">
          <div>
            <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">On this page</h4>
            <nav className="space-y-3 border-l border-gray-800 ml-1">
              {['Project Abstract', 'Source Intelligence', 'Technical Notes'].map((label) => (
                <a key={label} className="block pl-4 text-sm text-gray-500 hover:text-white transition-colors border-l border-transparent hover:border-blue-500 -ml-[1px]">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* 2. The Main Manuscript */}
      <main className="flex-1 max-w-2xl space-y-20 pb-40">
        
        {/* Header Section */}
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            <Sparkles size={10} /> AI Authored
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">{project?.name}</h1>
          <p className="text-xl text-gray-500 leading-relaxed font-light italic border-l-2 border-gray-800 pl-6">
            An automated technical overview derived from source code and neural observations.
          </p>
        </header>

        {/* Section: Source Code Ingestion */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 text-white font-bold text-lg">
            <Terminal className="text-blue-500" size={20} />
            <h2>Source Intelligence</h2>
          </div>
          
          <div className="space-y-12">
            {memories.filter(m => m.tag === 'CODE').map((m, i) => (
              <div key={m.id} className="group relative">
                <div className="absolute -left-4 top-0 bottom-0 w-[1px] bg-gray-800 group-hover:bg-blue-500/50 transition-colors" />
                <h3 className="text-sm font-mono text-gray-400 mb-4 flex items-center gap-2">
                  <FileText size={14} className="text-gray-600" />
                  Code Module {i + 1}
                </h3>
                <div className="bg-[#16181e] border border-gray-800 rounded-2xl p-6 overflow-hidden">
                  <pre className="text-xs text-gray-400 font-mono leading-relaxed overflow-x-auto">
                    <code>{m.content.replace('SOURCE FILE:', '// Source Context:')}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Contextual Notes */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 text-white font-bold text-lg pt-10 border-t border-gray-800">
            <BookOpen className="text-purple-500" size={20} />
            <h2>Implementation Notes</h2>
          </div>
          
          <div className="grid gap-8">
            {memories.filter(m => m.tag !== 'CODE').map((m) => (
              <div key={m.id} className="prose prose-invert">
                <p className="text-gray-400 leading-8 text-lg">{m.content}</p>
                {m.image_url && (
                  <img src={m.image_url} className="rounded-3xl border border-gray-800 shadow-2xl mt-6 grayscale hover:grayscale-0 transition-all duration-700" />
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
