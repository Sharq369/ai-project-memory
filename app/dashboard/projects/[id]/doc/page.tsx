'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
// VERIFIED: 5 levels back to root from app/dashboard/projects/[id]/doc/
import { supabase } from '../../../../../lib/supabase'
import TaskSentinel from '../../../../../components/TaskSentinel'
import SyncProvider from '../../../../../components/SyncProvider'
import { Code, Cpu, RefreshCcw, Copy, CheckCircle, Search, Sparkles } from 'lucide-react'

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
    } catch (err) {
      console.error("Neural search failed", err)
    } finally {
      setIsSearching(false)
    }
  }

  const copyForAI = () => {
    const context = results.map(r => `FILE: ${r.file_name}\n\n${r.content}`).join('\n\n---\n\n')
    const prompt = `I am working on the project "${project?.name}". Here is relevant code context:\n\n${context}\n\nBased on this, help me with my next step.`
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#050505] text-white overflow-hidden">
      {/* LEFT: WORKFLOW PROTOCOL */}
      <TaskSentinel projectId={projectId} />

      {/* RIGHT: NEURAL WORKSPACE */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_transparent_50%)]">
        <header className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Cpu className="text-blue-400 animate-pulse" size={18} />
            <h1 className="text-[10px] font-black uppercase tracking-[0.5em] italic text-blue-100">
              Neural Node // {project?.name || 'Initalizing...'}
            </h1>
          </div>
          <SyncProvider projectId={projectId} provider={project?.provider || 'github'} />
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* NEURAL SEARCH ENGINE */}
            <section className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-white/10 p-10 lg:p-16 rounded-[3rem] shadow-2xl">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={10} /> Active Vibe Mode
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tighter uppercase italic">Search Memory</h2>
                
                <div className="relative max-w-xl mx-auto group">
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:border-blue-500/50 transition-all font-mono text-sm pr-16 shadow-inner"
                    placeholder="Describe what logic you need..."
                  />
                  <button onClick={handleSearch} className="absolute right-3 top-3 p-3 rounded-xl bg-white text-black hover:scale-95 active:scale-90 transition-all">
                    {isSearching ? <RefreshCcw size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                </div>

                {results.length > 0 && (
                  <button onClick={copyForAI} className="flex items-center gap-3 mx-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                    {copied ? <CheckCircle size={14}/> : <Copy size={14}/>} 
                    {copied ? 'Context Ready' : 'Inject Context to AI'}
                  </button>
                )}
              </div>
            </section>

            {/* RESULTS VIEW */}
            <div className="grid grid-cols-1 gap-6 pb-20">
              {results.map((res, i) => (
                <div key={i} className="bg-[#0a0b0f] border border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500/20 transition-all">
                  <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <Code className="text-blue-500" size={12} />
                      <span className="text-[10px] font-mono text-gray-500 tracking-tighter">{res.file_name}</span>
                    </div>
                  </div>
                  <pre className="p-6 text-[11px] text-gray-400 font-mono leading-relaxed bg-black/30 max-h-80 overflow-y-auto">
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
