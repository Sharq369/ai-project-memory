'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  ChevronLeft, Loader2, MessageSquare, Send, 
  X, Pencil, Github, Gitlab, Cloud, Terminal, Box, Check, Copy, Zap, Trash2, Globe, Cpu, HardDrive, Server, Shield
} from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // --- STATES ---
  const [memories, setMemories] = useState<any[]>([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [selectedFile, setSelectedFile] = useState<any | null>(null)
  
  // Track which specific card was copied
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [fileCopied, setFileCopied] = useState(false)
  
  // Sync States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')

  // --- FULL DEPLOYMENT MANIFEST ---
  const deployTargets = [
    { name: 'VERCEL EDGE', status: 'ACTIVE', icon: <Globe size={10}/> },
    { name: 'AWS LAMBDA', status: 'STANDBY', icon: <Cpu size={10}/> },
    { name: 'AZURE BLOB', status: 'OFFLINE', icon: <HardDrive size={10}/> },
    { name: 'CLOUDFLARE', status: 'ACTIVE', icon: <Shield size={10}/> },
    { name: 'NETLIFY', status: 'STANDBY', icon: <Server size={10}/> }
  ]

  // --- DATA LOADING ---
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

  // --- ACTIONS ---
  const handleCopy = (e: React.MouseEvent, content: string, memoryId: string) => {
    e.stopPropagation() // Prevents opening the modal
    navigator.clipboard.writeText(content)
    setCopiedId(memoryId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDeleteMemory = async (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation() 
    if (!confirm("PERMANENTLY WIPE THIS NODE FROM DATABASE?")) return

    const { error } = await supabase
      .from('code_memories')
      .delete()
      .eq('id', memoryId)

    if (error) {
      alert(`Wipe Failed: ${error.message}`)
    } else {
      setMemories(prev => prev.filter(m => m.id !== memoryId))
    }
  }

  const handleRename = async () => {
    if (!editName.trim() || editName === project?.name) {
      setIsEditing(false)
      return
    }
    const { error } = await supabase.from('projects').update({ name: editName }).eq('id', id)
    if (!error) setProject({ ...project, name: editName })
    setIsEditing(false)
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
    } finally { 
      setIsThinking(false) 
    }
  }

  // Proper build-safe loading check
  if (loading) {
    return (
      <div className="h-screen bg-[#0a0b0e] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex overflow-hidden relative font-sans">
      
      {/* MAIN VIEWPORT */}
      <div className={`flex-1 p-6 lg:p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-white text-[9px] font-black uppercase mb-12 tracking-[0.2em] group transition-all">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> BACK TO VAULT
        </button>

        <div className="max-w-6xl mx-auto">
          {/* HEADER SECTION - FULL DESIGN RESTORED */}
          <header className="bg-[#111319] border border-gray-800/40 p-10 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-start mb-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            
            <div className="flex-1 w-full">
              <div className="flex items-center gap-4 mb-10">
                {isEditing ? (
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleRename} onKeyDown={(e) => e.key === 'Enter' && handleRename()} className="bg-black/50 border border-blue-600 rounded-xl px-4 py-2 text-5xl font-black uppercase text-white outline-none w-full max-w-xl"/>
                ) : (
                  <>
                    <h1 className="text-5xl lg:text-7xl font-black italic uppercase tracking-tighter leading-none">{project?.name}</h1>
                    <button onClick={() => { setEditName(project?.name); setIsEditing(true); }} className="p-2 text-blue-500/50 hover:text-blue-500 transition-colors"><Pencil size={18} /></button>
                  </>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-12">
                <div className="space-y-4">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">Source Protocols</p>
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveProvider('github'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:text-blue-500 transition-all border border-white/5"><Github size={20} /></button>
                    <button onClick={() => { setActiveProvider('gitlab'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:text-orange-500 transition-all border border-white/5"><Gitlab size={20} /></button>
                    <button onClick={() => { setActiveProvider('bitbucket' as any); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:text-blue-400 transition-all border border-white/5"><Cloud size={20} /></button>
                  </div>
                </div>

                <div className="hidden lg:block w-px h-16 bg-gray-800/50 mt-4"></div>

                <div className="flex-1">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Deployment Manifest</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {deployTargets.map((target) => (
                      <div key={target.name} className="flex items-center justify-between px-5 py-3 bg-black/40 border border-gray-800/40 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">{target.icon}</span>
                          <span className="text-[9px] font-bold text-gray-400 tracking-wider">{target.name}</span>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full ${target.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-700'}`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setChatOpen(!chatOpen)} className="mt-8 lg:mt-0 bg-blue-600 p-8 rounded-[2.5rem] hover:scale-105 transition-all shadow-xl shadow-blue-900/20 active:scale-95 group relative">
              <MessageSquare size={32} fill="white" stroke="none" />
              <div className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-[#111319]">LIVE</div>
            </button>
          </header>

          <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-600 mb-8 flex items-center gap-3">
            <Box size={18}/> Archived Nodes
          </h2>

          {/* MEMORY CARDS - DESIGN RESTORED + COPY BUTTON + DELETE ADDED */}
          <div className="grid grid-cols-1 gap-6 pb-40">
            {memories.map((mem) => (
              <div key={mem.id} onClick={() => setSelectedFile(mem)} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] group hover:border-blue-600/30 transition-all cursor-pointer relative overflow-hidden shadow-lg active:scale-[0.99]">
                <div className="flex justify-between items-center p-8 border-b border-gray-800/20 bg-white/[0.01]">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 group-hover:bg-blue-600/20 transition-all">
                      <Terminal size={20} className="text-blue-500"/>
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">{mem.file_name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black uppercase px-4 py-2 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 mr-2">VERIFIED</span>
                    
                    {/* RESTORED COPY BUTTON ON CARD */}
                    <button 
                      onClick={(e) => handleCopy(e, mem.content, mem.id)} 
                      className="p-3 text-gray-600 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      {copiedId === mem.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>

                    {/* DELETE BUTTON */}
                    <button 
                      onClick={(e) => handleDeleteMemory(e, mem.id)} 
                      className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <pre className="p-8 bg-black/60 rounded-[1.8rem] text-[11px] text-gray-500 font-mono overflow-hidden line-clamp-3 border border-gray-800/20">
                    <code>{mem.content}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CODE PREVIEW MODAL --- */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div className="bg-[#0a0b0e] border border-gray-800/50 w-full max-w-6xl h-[85vh] rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-10 py-8 bg-[#111319] border-b border-gray-800/50">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{selectedFile.file_name}</span>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => { navigator.clipboard.writeText(selectedFile.content); setFileCopied(true); setTimeout(() => setFileCopied(false), 2000); }}
                  className="text-[9px] font-black uppercase text-gray-400 hover:text-white flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5"
                >
                  {fileCopied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>} {fileCopied ? 'COPIED' : 'COPY NODE'}
                </button>
                <button onClick={() => setSelectedFile(null)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-10 bg-black/20 custom-scrollbar">
              <pre className="text-[13px] leading-relaxed font-mono text-blue-100/70 whitespace-pre"><code>{selectedFile.content}</code></pre>
            </div>
          </div>
        </div>
      )}

      {/* --- SYNC MODAL --- */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[250] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative">
            <button onClick={() => setIsSyncModalOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white"><X size={18}/></button>
            <h2 className="text-xl font-black italic uppercase mb-8">{activeProvider} SYNC</h2>
            <input autoFocus value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="owner/repository" className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 mb-6"/>
            <button onClick={() => {/* your sync logic */}} disabled={isSyncing || !repoName.trim()} className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              {isSyncing ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>} {isSyncing ? 'SYNCING...' : 'INITIATE SYNC'}
            </button>
          </div>
        </div>
      )}

      {/* --- SIDEBAR CHAT --- */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-[150] ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-10">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div> NEURAL HUB
            </h3>
            <button onClick={() => setChatOpen(false)} className="text-gray-600 hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#111319] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isThinking && <Loader2 size={16} className="animate-spin text-blue-500 ml-4" />}
          </div>
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="QUERY ARCHIVE..." className="w-full bg-[#111319] border border-gray-800 rounded-3xl py-6 pl-8 pr-16 text-[11px] font-black uppercase text-white outline-none focus:border-blue-600 transition-all"/>
            <button onClick={handleSendMessage} className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-500"><Send size={22} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
