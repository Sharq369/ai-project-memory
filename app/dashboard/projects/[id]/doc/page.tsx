'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  ChevronLeft, Loader2, MessageSquare, Send, 
  X, Pencil, Github, Gitlab, Cloud, Terminal, Box, Check, Copy, Zap
} from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  
  // Initialize Supabase Browser Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Core Data State
  const [memories, setMemories] = useState<any[]>([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [isThinking, setIsThinking] = useState(false)
  
  // Edit & Utility State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [copied, setCopied] = useState(false)

  // --- SYNC ENGINE STATE ---
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')

  const deployTargets = [
    { name: 'VERCEL', status: 'Active' },
    { name: 'AWS', status: 'Ready' },
    { name: 'AZURE', status: 'Idle' },
    { name: 'GCP', status: 'Idle' },
    { name: 'NETLIFY', status: 'Ready' },
    { name: 'RAILWAY', status: 'Idle' }
  ]

  // Data Loading
  const loadData = useCallback(async () => {
    if (!id) return
    const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
    setProject(proj)
    
    const { data: mems } = await supabase
      .from('code_memories')
      .select('*')
      .eq('project_id', id)
      .order('file_name', { ascending: true })
    
    if (mems) setMemories(mems)
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- ACTION HANDLERS ---

  const handleRename = async () => {
    if (!editName.trim() || editName === project.name) {
      setIsEditing(false)
      return
    }
    const { error } = await supabase.from('projects').update({ name: editName }).eq('id', id)
    if (!error) setProject({ ...project, name: editName })
    setIsEditing(false)
  }

  const handleSyncTrigger = async () => {
    if (!repoName.trim()) return
    setIsSyncing(true)
    
    try {
      const response = await fetch(`/api/sync/${activeProvider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoName, projectId: id })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Success: ${result.count} files synchronized to Neural Node.`)
        await loadData() // Refresh list
        setIsSyncModalOpen(false)
        setRepoName('')
      } else {
        alert(`Sync Error: ${result.error}`)
      }
    } catch (err) {
      alert("Neural link failed to establish. Check connection.")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!query.trim() || isThinking) return
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setIsThinking(true)
    
    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        body: JSON.stringify({ query: userMsg.content, projectId: id }) 
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.response || data.error }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "SYSTEM ERROR: Neural Hub unreachable." }])
    } finally { 
      setIsThinking(false) 
    }
  }

  const copyNeuralContext = async () => {
    if (memories.length === 0) return
    const contextHeader = `NEURAL NODE CONTEXT: Project "${project?.name}"\n`
    const contextBody = memories.map(mem => (`FILE: ${mem.file_name}\nCONTENT:\n${mem.content}\n---`)).join('\n')
    await navigator.clipboard.writeText(`${contextHeader}\n${contextBody}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="h-screen bg-[#0a0b0e] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex overflow-hidden relative font-sans">
      
      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-white text-[9px] font-black uppercase mb-12 tracking-widest group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> BACK TO VAULT
        </button>

        <div className="max-w-5xl mx-auto">
          {/* HEADER SECTION */}
          <header className="bg-[#111319] border border-gray-800/40 p-10 rounded-[2.5rem] flex justify-between items-start mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-8 h-16">
                {isEditing ? (
                  <div className="flex items-center gap-4">
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename()} className="bg-black/50 border border-blue-600 rounded-xl px-4 py-2 text-5xl font-black italic uppercase tracking-tighter text-white outline-none w-full max-w-md"/>
                    <button onClick={handleRename} className="p-3 bg-blue-600 rounded-lg hover:bg-white hover:text-black transition-all"><Check size={18} /></button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">{project?.name}</h1>
                    <button onClick={() => { setEditName(project?.name); setIsEditing(true); }} className="p-2 bg-blue-600/10 border border-blue-600/20 rounded-lg text-blue-500 hover:bg-blue-600 hover:text-white transition-all"><Pencil size={14} /></button>
                  </>
                )}
              </div>

              <div className="flex gap-12">
                <div className="space-y-4">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">Source Protocols</p>
                  <div className="flex gap-4">
                    {/* FIXED: CLICKING THESE NOW OPENS THE MODAL */}
                    <button onClick={() => { setActiveProvider('github'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-blue-500 transition-all">
                      <Github size={20} />
                    </button>
                    <button onClick={() => { setActiveProvider('gitlab'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-orange-500 transition-all">
                      <Gitlab size={20} />
                    </button>
                    <button onClick={() => { setActiveProvider('bitbucket' as any); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-blue-400 transition-all">
                      <Cloud size={20} />
                    </button>
                  </div>
                </div>

                <div className="w-px h-16 bg-gray-800 mt-4"></div>

                <div className="flex-1">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Deployment Manifest</p>
                  <div className="grid grid-cols-3 gap-2">
                    {deployTargets.map((target) => (
                      <div key={target.name} className="flex items-center justify-between px-4 py-2 bg-black/40 border border-gray-800/40 rounded-lg">
                        <span className="text-[9px] font-black text-gray-400">{target.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${target.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CHAT TOGGLE BUTTON */}
            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-7 rounded-[2.2rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-900/40 ml-8 relative group">
              <MessageSquare size={32} fill="white" stroke="none" />
              <div className="absolute -top-2 -right-2 bg-red-500 text-[8px] font-bold px-2 py-1 rounded-full border-2 border-[#0a0b0e]">LIVE</div>
            </button>
          </header>

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-400">Archived Nodes</h2>
            <button 
              onClick={copyNeuralContext} 
              disabled={memories.length === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-green-600 text-white' : memories.length === 0 ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' : 'bg-[#111319] border border-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white'}`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'CONTEXT SYNCED' : 'COPY NODE CONTEXT'}
            </button>
          </div>

          {/* MEMORY LIST */}
          <div className="space-y-8 pb-32">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] overflow-hidden group hover:border-blue-600/20 transition-all">
                <div className="flex justify-between items-center p-8 border-b border-gray-800/40 bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    <Terminal size={18} className="text-blue-500"/>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{mem.file_name}</h3>
                      <p className="text-[7px] text-gray-600 font-bold uppercase mt-1">Status: Verified</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-2">
                    <Box size={10}/> GROUNDED STATE
                  </span>
                </div>
                <div className="p-8">
                  <pre className="p-8 bg-black/60 rounded-[1.5rem] text-[11px] font-mono text-gray-400 overflow-x-auto border border-gray-800/20 scrollbar-hide">
                    <code>{mem.content}</code>
                  </pre>
                </div>
              </div>
            ))}
            
            {memories.length === 0 && !loading && (
              <div className="text-center p-20 border border-dashed border-gray-800 rounded-[2.5rem] bg-[#111319]/30">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">No grounded code memories detected.</p>
                <button onClick={() => setIsSyncModalOpen(true)} className="px-8 py-4 bg-blue-600 hover:bg-white hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 mx-auto">
                  <Zap size={14} fill="currentColor"/> Initiate First Sync
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SYNC MODAL --- */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative shadow-2xl">
            <button onClick={() => setIsSyncModalOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors">
              <X size={18}/>
            </button>
            <div className="flex items-center gap-3 mb-2">
              {activeProvider === 'github' && <Github className="text-blue-500" />}
              {activeProvider === 'gitlab' && <Gitlab className="text-orange-500" />}
              {activeProvider === 'bitbucket' && <Cloud className="text-blue-400" />}
              <h2 className="text-xl font-black italic uppercase">{activeProvider} SYNC</h2>
            </div>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-8 leading-relaxed">Fetch repository files into this Neural Node.</p>
            
            <input 
              autoFocus
              value={repoName} 
              onChange={(e) => setRepoName(e.target.value)} 
              placeholder="e.g., owner/repository-name"
              className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 mb-6 transition-all"
            />
            
            <button 
              onClick={handleSyncTrigger} 
              disabled={isSyncing || !repoName.trim()}
              className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isSyncing ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-white hover:text-black'}`}
            >
              {isSyncing ? <><Loader2 size={14} className="animate-spin"/> SYNCING DATA...</> : <><Zap size={14}/> INITIATE SYNC</>}
            </button>
          </div>
        </div>
      )}

      {/* --- CHAT HUB SIDEBAR --- */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div> NEURAL HUB
            </h3>
            <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X size={18} className="text-gray-600" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
            {messages.length === 0 && (
              <p className="text-[10px] text-gray-600 font-black uppercase text-center mt-20 tracking-widest">Awaiting Queries...</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[1.8rem] text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#111319] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-[#111319] border border-gray-800 p-6 rounded-[1.8rem]">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="QUERY ARCHIVE..." 
              className="w-full bg-[#111319] border border-gray-800 rounded-2xl py-6 pl-8 pr-16 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 transition-all shadow-lg"
            />
            <button onClick={handleSendMessage} className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-white transition-colors">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
