'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import TaskSentinel from '../../../../../components/TaskSentinel'
import { Terminal, Database, Code, Cpu, RefreshCcw, Copy, CheckCircle } from 'lucide-react'

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
    const context = results.map(r => `File: ${r.file_name}\nContent: ${r.content}`).join('\n\n')
    navigator.clipboard.writeText(context)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#050505] overflow-hidden">
      <TaskSentinel projectId={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-900 bg-[#0a0b0f] flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Cpu className="text-blue-500" size={16} />
            <h1 className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">
              Node: {project?.name || 'SYNCING...'}
            </h1>
          </div>
          <div className="flex gap-4">
            {results.length > 0 && (
              <button onClick={copyContext} className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-full text-blue-500 text-[8px] font-black uppercase tracking-widest">
                {copied ? <CheckCircle size={10}/> : <Copy size={10}/>} {copied ? 'Injected' : 'Copy Context'}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-10">
            <section className="bg-[#0f1117] border border-gray-800 p-8 lg:p-16 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
              <div className="relative z-10 text-center space-y-6">
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Neural Memory Access</h2>
                <div className="relative mt-10 max-w-xl mx-auto">
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-black border border-gray-800 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-500 transition-all font-mono text-xs pr-16"
                    placeholder="Search synced codebase..."
                  />
                  <button onClick={handleSearch} className="absolute right-3 top-3 p-2.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-all">
                    {isSearching ? <RefreshCcw size={18} className="animate-spin"/> : <Terminal size={18} />}
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4">
              {results.map((res, i) => (
                <div key={i} className="bg-[#0f1117] border border-gray-800 p-6 rounded-2xl group hover:border-blue-500/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Code className="text-blue-500" size={14} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{res.file_name}</span>
                    </div>
                  </div>
                  <pre className="text-[10px] text-gray-500 font-mono overflow-x-auto bg-black/50 p-4 rounded-lg border border-gray-900 leading-relaxed">
                    {res.content.substring(0, 500)}...
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
