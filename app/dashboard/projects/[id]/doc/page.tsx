'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
// VERIFIED: Relative paths to bypass Vercel alias errors
import { supabase } from '../../../../../lib/supabase'
import TaskSentinel from '../../../../../components/TaskSentinel'
import SyncProvider from '../../../../../components/SyncProvider'
import { Code, Cpu, RefreshCcw, Copy, CheckCircle, Search, ShieldCheck } from 'lucide-react'

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

  // THE FULL SECURITY-FIRST INJECTION LOGIC
  const injectContextToAI = () => {
    const codeBlocks = results.map(r => `FILE: ${r.file_name}\n\`\`\`\n${r.content}\n\`\`\``).join('\n\n')
    
    const securityPrompt = `
    SYSTEM ROLE: Expert Senior Security Engineer.
    PROJECT: "${project?.name || 'Vibe Project'}"
    
    CONTEXT DATA:
    ${codeBlocks}
    
    VIBE CODING REQUEST:
    Help me with the next implementation step, but follow these STRICT SECURITY RULES:
    1. VULNERABILITY AUDIT: Before writing code, check the provided context for leaked secrets, SQL injection risks, or RLS bypasses.
    2. SECURE CODE ONLY: Ensure any new code uses parameterized queries and validates user_id via Supabase auth.uid().
    3. MINIMAL EXPOSURE: Do not suggest solutions that require NEXT_PUBLIC_ prefixes for sensitive keys.
    
    OUTPUT FORMAT:
    - [SECURITY CHECK]: (List any risks found in the context)
    - [SECURE IMPLEMENTATION]: (The code payload)
    - [VIBE CHECK]: (Concise implementation notes)
    `.trim()

    navigator.clipboard.writeText(securityPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#050505] text-white overflow-hidden font-sans">
      {/* LEFT SIDEBAR: SENTINEL PROTOCOL */}
      <TaskSentinel projectId={projectId} />

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_#0f172a_0%,_transparent_50%)]">
        
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Cpu className="text-blue-400" size={18} />
            </div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] italic text-blue-100/70">
              Neural Node // {project?.name || 'Initializing...'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <ShieldCheck size={12} className="text-green-500" />
              <span className="text-[9px] font-black uppercase text-green-500">RLS Active</span>
            </div>
            <SyncProvider projectId={projectId} provider={project?.provider || 'github'} />
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative">
          <div className="max-w-4xl mx-auto space-y-12 relative z-10">
            
            {/* SEARCH SECTION */}
            <section className="bg-gradient-to-br from-[#0f172a] via-[#020617] to-black border border-white/10 p-12 lg:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <ShieldCheck size={200} />
              </div>

              <div className="text-center space-y-8 relative z-10">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Neural Memory</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Secure Context Injection Engine</p>
                </div>
                
                <div className="relative max-w-xl mx-auto">
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-black/60 border border-white/10 rounded-[2rem] px-8 py-6 outline-none focus:border-blue-500/50 transition-all font-mono text-sm pr-20 shadow-2xl"
                    placeholder="Search logic for security audit..."
                  />
                  <button onClick={handleSearch} className="absolute right-4 top-4 p-4 rounded-2xl bg-white text-black hover:scale-95 active:scale-90 transition-all shadow-lg">
                    {isSearching ? <RefreshCcw size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                </div>

                {results.length > 0 && (
                  <button 
                    onClick={injectContextToAI} 
                    className="group flex items-center gap-4 mx-auto px-12 py-5 bg-blue-600 hover:bg-blue-500 rounded-[2rem] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)]"
                  >
                    {copied ? <CheckCircle size={16} className="animate-bounce" /> : <Copy size={16} />} 
                    {copied ? 'Audit Prompt Copied' : 'Inject Secure Context'}
                  </button>
                )}
              </div>
            </section>

            {/* RESULTS FEED */}
            <div className="grid grid-cols-1 gap-8 pb-32">
              {results.map((res, i) => (
                <div key={i} className="bg-[#0a0b0f]/80 backdrop-blur-sm border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-blue-500/30 transition-all group">
                  <div className="bg-white/5 px-8 py-4 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <Code className="text-blue-500/50" size={14} />
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{res.file_name}</span>
                    </div>
                  </div>
                  <pre className="p-8 text-[12px] text-gray-400 font-mono leading-relaxed bg-black/40 max-h-[500px] overflow-y-auto scrollbar-hide">
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
