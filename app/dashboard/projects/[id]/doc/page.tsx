'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TaskSentinel from '@/components/TaskSentinel'
import SyncProvider from '@/components/SyncProvider'
import { Terminal, Code, Cpu, RefreshCcw, Copy, CheckCircle, Search, LayoutTemplate } from 'lucide-react'

export default function ProjectMainView() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchProject() {
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
      if (data) setProject(data)
    }
    fetchProject()
  }, [projectId])

  const handleSearch = async () => {
    if (!searchQuery) return
    setIsSearching(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, projectId })
      })
      const data = await response.json()
      setResults(data.results || [])
    } finally {
      setIsSearching(false)
    }
  }

  const copyContext = () => {
    const context = results.map(r => `FILE: ${r.file_name}\n\nCONTENT:\n${r.content}`).join('\n\n---\n\n')
    const finalPrompt = `CONTEXT FROM CODEBASE:\n\n${context}\n\nINSTRUCTION: Using the code above, help me with the following task:`
    navigator.clipboard.writeText(finalPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#050505] overflow-hidden text-white font-sans">
      {/* 🛡️ FEATURE: TASK SENTINEL */}
      <TaskSentinel projectId={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 border-b border-white/5 bg-[#0a0b0f] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Cpu className="text-blue-500" size={16} />
            </div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-70">
              Neural Node: {project?.name || 'Loading...'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <SyncProvider projectId={projectId} provider={project?.provider || 'github'} />
          </div>
        </header>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-12 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* 🧠 FEATURE: NEURAL SEARCH */}
            <section className="bg-[#0f1117] border border-white/5 p-8 lg:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <LayoutTemplate size={120} />
              </div>

              <div className="relative z-10 text-center space-y-6">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Neural Memory Access</h2>
                <p className="text-gray-500 text-xs max-w-sm mx-auto uppercase tracking-widest font-bold">Search your synced code for AI context injection</p>
                
                <div className="relative mt-10 max-w-xl mx-auto">
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-500 transition-all font-mono text-sm pr-16"
                    placeholder="Search functions, logic, or variables..."
                  />
                  <button onClick={handleSearch} className="absolute right-3 top-3 p-3 rounded-xl bg-white text-black hover:scale-95 transition-all">
                    {isSearching ? <RefreshCcw size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                </div>

                {results.length > 0 && (
                  <button onClick={copyContext} className="flex items-center gap-3 mx-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                    {copied ? <CheckCircle size={16}/> : <Copy size={16}/>} 
                    {copied ? 'Context Injected' : 'Inject Context to AI'}
                  </button>
                )}
              </div>
            </section>

            {/* CODE PREVIEW RESULTS */}
            <div className="grid grid-cols-1 gap-6 pb-20">
              {results.map((res, i) => (
                <div key={i} className="bg-[#0a0b0f] border border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Code className="text-blue-500" size={14} />
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{res.file_name}</span>
                    </div>
                  </div>
                  <pre className="p-6 text-[11px] text-gray-400 font-mono overflow-x-auto leading-relaxed bg-black/20 max-h-96 overflow-y-auto">
                    {res.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
