'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { 
  BookOpen, Terminal, Sparkles, 
  FileCode, Cpu, ArrowLeft, Loader2 
} from 'lucide-react'
import Link from 'next/link'

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-[#0f1117]">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Synthesizing Manuscript...</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto min-h-screen pb-40 px-6 animate-in fade-in duration-1000">
      
      {/* Navigation Header */}
      <nav className="py-8 flex items-center justify-between border-b border-gray-800/50 mb-16">
        <Link href="/dashboard/projects" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">
          <ArrowLeft size={14} /> Back to Vault
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
          <Cpu size={10} /> AI Documentation Mode
        </div>
      </nav>

      <div className="flex flex-col md:flex-row gap-16">
        
        {/* Sidebar TOC */}
        <aside className="md:w-64 shrink-0 hidden md:block">
          <div className="sticky top-12 space-y-10">
            <div>
              <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-6">Contents</h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-tighter">
                <li className="text-blue-400 flex items-center gap-2"><Sparkles size={12}/> 01. Executive Summary</li>
                <li className="text-gray-700 flex items-center gap-2">02. Logic Architecture</li>
                <li className="text-gray-700 flex items-center gap-2">03. Implementation</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* The Document */}
        <main className="flex-1 space-y-24">
          
          <section className="space-y-6">
            <h1 className="text-6xl font-extrabold text-white tracking-tighter leading-none">
              {project?.name || 'Untitled Project'}
            </h1>
            <p className="text-xl text-gray-500 font-light leading-relaxed max-w-2xl border-l-2 border-blue-500/20 pl-6">
              A professional technical manuscript synthesized from source intelligence and developer context.
            </p>
          </section>

          {/* Section: Source Code Ingestion */}
          <section className="space-y-12">
            <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
              <Terminal className="text-blue-500" size={24} />
              <h2>System Implementation</h2>
            </div>

            <div className="space-y-16">
              {memories.filter(m => m.tag === 'CODE').map((m, i) => (
                <div key={m.id} className="group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-blue-500/30" />
                    <span className="text-[10px] font-mono text-blue-500/50 uppercase tracking-[0.2em]">Module {i + 1}</span>
                  </div>
                  <div className="bg-[#16181e] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-blue-500/20">
                    <div className="bg-[#1c1f26] px-6 py-3 border-b border-gray-800 flex justify-between items-center">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Source Context</span>
                      <FileCode size={14} className="text-gray-600" />
                    </div>
                    <pre className="p-8 overflow-x-auto">
                      <code className="text-xs font-mono leading-relaxed text-gray-400 block whitespace-pre">
                        {m.content.replace('SOURCE FILE:', '// Analysis of:')}
                      </code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: General Context */}
          <section className="space-y-12 pt-12 border-t border-gray-800/50">
            <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
              <BookOpen className="text-purple-500" size={24} />
              <h2>Developer Annotations</h2>
            </div>
            
            <div className="grid gap-12">
              {memories.filter(m => m.tag !== 'CODE').map((m) => (
                <div key={m.id} className="relative pl-8 group">
                  <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gray-800 group-hover:bg-purple-500/50 transition-colors" />
                  <p className="text-gray-300 text-lg leading-8 font-light italic">
                    {m.content}
                  </p>
                  {m.image_url && (
                    <div className="mt-8 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl max-w-xl">
                       <img src={m.image_url} className="w-full grayscale hover:grayscale-0 transition-all duration-1000" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
