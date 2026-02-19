'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import TaskSentinel from '../../../../../components/TaskSentinel'
import SyncProvider from '../../../../../components/SyncProvider'
import { Terminal, Code, Cpu, RefreshCcw, Copy, CheckCircle, Search } from 'lucide-react'

export default function ProjectMainView() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load project metadata on mount
  useEffect(() => {
    async function fetchProject() {
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
      if (data) setProject(data)
    }
    fetchProject()
  }, [projectId])

  // Neural Search Logic
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
      console.error("Search failed", err)
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

  const resetSentinel = async () => {
    if (confirm("REBOOT SYSTEM? This will wipe the current workflow steps.")) {
      await supabase.from('tasks').delete().eq('project_id', projectId)
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#050505] overflow-hidden">
      {/* Left Sidebar: Progress Tracking */}
      <TaskSentinel projectId={projectId} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navigation & Sync Control */}
        <header className="h-16 border-b border-gray-900 bg-[#0a0b0f] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Cpu className="text-blue-500" size={16} />
            <h1 className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">
              Node: {project?.name || 'INITIALIZING...'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <SyncProvider projectId={projectId} provider={project?.provider || 'github'} />
            <button onClick={resetSentinel} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-500 transition-all">
              <RefreshCcw size={14} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Search Section */}
            <section className="bg-[#0f1117] border border-gray-800 p-6 lg:p-12 rounded-[2rem] shadow-2xl relative">
              <div className="text-center space-y-4">
                <h2 className="text-sm font-black text-white italic uppercase tracking-widest">Neural Memory Search</h2>
                
                <div className="relative max-w-lg mx-auto">
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-black border border-gray-800 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 font-mono text-xs pr-14"
                    placeholder="Search codebase contents..."
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute right-2 top-2 p-2.5 rounded-lg bg-white text-black hover:bg-gray-200 transition-all"
                  >
                    {isSearching ? <RefreshCcw size={16} className="animate-spin" /> : <Search size={16} />}
                  </button>
                </div>

                {results.length > 0 && (
                  <button 
                    onClick={copyContext} 
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-[9px] font-black uppercase tracking-widest"
                  >
                    {copied ? <CheckCircle size={12}/> : <Copy size={12}/>} 
                    {copied ? 'Context Copied' : 'Inject Context to AI'}
                  </button>
                )}
              </div>
            </section>

            {/* Results Display */}
            <div className="grid grid-cols-1 gap-4 pb-10">
              {results.map((res, i) => (
                <div key={i} className="bg-[#0a0b0f] border border-gray-800 rounded-2xl overflow-hidden group hover:border-blue-500/40 transition-all">
                  <div className="bg-[#14151a] px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Code className="text-blue-500" size={12} />
                      <span className="text-[10px] font-mono text-gray-400">{res.file_name}</span>
                    </div>
                  </div>
                  <pre className="p-4 text-[11px] text-gray-500 font-mono overflow-x-auto leading-relaxed max-h-60 overflow-y-auto bg-black/40">
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
