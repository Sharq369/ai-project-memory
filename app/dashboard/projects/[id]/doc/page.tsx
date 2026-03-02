'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  ChevronLeft, Loader2, MessageSquare, Send, 
  X, Pencil, Github, Gitlab, Cloud, Terminal, Box, Check, Copy, Zap, Trash2
} from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // --- CORE STATE (Restored from source) ---
  const [memories, setMemories] = useState<any[]>([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [copied, setCopied] = useState(false)
  const [individualCopiedId, setIndividualCopiedId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<any | null>(null)

  // --- SYNC ENGINE STATE ---
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')

  // --- FULL DEPLOYMENT MANIFEST (Restored all 6 targets) ---
  const deployTargets = [
    { name: 'VERCEL', status: 'Active' },
    { name: 'AWS', status: 'Ready' },
    { name: 'AZURE', status: 'Idle' },
    { name: 'GCP', status: 'Idle' },
    { name: 'NETLIFY', status: 'Ready' },
    { name: 'RAILWAY', status: 'Idle' },
    { name: 'CLOUDFLARE', status: 'Idle' }
  ]

  [cite_start]// Data Loading [cite: 4]
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
    if (!editName.trim() || editName === project?.name) {
      setIsEditing(false)
      return
    }
    const { error } = await supabase.from('projects').update({ name: editName }).eq('id', id)
    if (!error) setProject({ ...project, name: editName })
    setIsEditing(false)
  }

  const handleDeleteMemory = async (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation() 
    if (!confirm("PERMANENTLY WIPE THIS NODE?")) return

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
        alert(`Success: ${result.count} files synchronized.`)
        await loadData()
        setIsSyncModalOpen(false)
        setRepoName('')
      } else {
        alert(`Sync Error: ${result.error}`)
      }
    } catch (err) {
      alert("Neural link failed.")
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

  const copyIndividualBlock = (e: React.MouseEvent, content: string, id: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(content)
    setIndividualCopiedId(id)
    setTimeout(() => setIndividualCopiedId(null), 2000)
  }

  [cite_start]// Proper build-safe loading check [cite: 11]
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
          [cite_start]{/* HEADER SECTION (Restored Design) [cite: 13] */}
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
                    <button onClick={() => { setEditName(project?.name); setIsEditing(true); }} className="p-2 bg-blue-600/10 border border-blue-600/20 rounded-lg text-blue-500 hover:bg-blue-600 hover:text-white transition-all ml-4"><Pencil size={14} /></button>
                  </>
                )}
              </div>

              <div className="flex gap-12">
                <div className="space-y-4">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">Source Protocols</p>
                  <div className="flex gap-4">
                    [cite_start]{/* Fixed Provider Buttons [cite: 18, 19, 20] */}
                    <button onClick={() => { setActiveProvider('github'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-blue-500 transition-all">
                      <Github size={20} />
                    </button>
                    <button onClick={() => { setActiveProvider('gitlab'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-orange-500 transition-all">
                      <Gitlab size={20} />
                    </button>
                    <button onClick={() => { setActiveProvider('bitbucket'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-blue-400 transition-all">
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

            [cite_start]{/* CHAT TOGGLE [cite: 24] */}
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

          [cite_start]{/* MEMORY LIST (Restored Design + Individual Actions) [cite: 29] */}
          <div className="space-y-8 pb-32">
            {memories.map((mem) => (
              <div key={mem.id} onClick={() => setSelectedFile(mem)} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] overflow-hidden group hover:border-blue-600/20 transition-all cursor-pointer">
                <div className="flex justify-between items-center p-8 border-b border-gray-800/40 bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    <Terminal size={18} className="text-blue-500"/>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{mem.file_name}</h3>
                      <p className="text-[7px] text-gray-600 font-bold uppercase mt-1">Status: Verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black uppercase px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-2 mr-2">
                      <Box size={10}/> GROUNDED STATE
                    </span>
                    {/* Restored Per-Card Copy Button */}
                    <button onClick={(e) => copyIndividualBlock(e, mem.content, mem.id)} className="p-3 text-gray-600 hover:text-white transition-colors">
                       {individualCopiedId === mem.id ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                    </button>
                    {/* Persistent Delete Button */}
                    <button onClick={(e) => handleDeleteMemory(e, mem.id)} className="p-3 text-gray-600 hover:text-red-500 transition-colors">
                       <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <pre className="p-8 bg-black/60 rounded-[1.5rem] text-[11px] font-mono text-gray-400 overflow-x-auto border border-gray-800/20 scrollbar-hide">
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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-12">
          <div className="bg-[#111319] border border-gray-800/50 w-full max-w-5xl h-[80vh] rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-10 py-8 border-b border-gray-800/50">
              <span className="text-[10px] font-black uppercase tracking-widest">{selectedFile.file_name}</span>
              <button onClick={() => setSelectedFile(null)} className="p-2 text-gray-500 hover:text-white"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-auto p-10">
              <pre className="text-[12px] font-mono text-blue-400/80 leading-relaxed"><code>{selectedFile.content}</code></pre>
            </div>
          </div>
        </div>
      )}

      [cite_start]{/* --- SYNC MODAL [cite: 35] --- */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative">
            <button onClick={() => setIsSyncModalOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white"><X size={18}/></button>
            <h2 className="text-xl font-black italic uppercase mb-8">{activeProvider} SYNC</h2>
            <input autoFocus value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="owner/repository" className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-[10px] font-black uppercase text-white outline-none mb-6"/>
            <button onClick={handleSyncTrigger} disabled={isSyncing || !repoName.trim()} className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              {isSyncing ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>} {isSyncing ? 'SYNCING...' : 'INITIATE SYNC'}
            </button>
          </div>
        </div>
      )}

      [cite_start]{/* --- CHAT HUB SIDEBAR [cite: 42] --- */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[11px] font-black uppercase text-blue-500 flex items-center gap-2"><div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div> NEURAL HUB</h3>
            <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl"><X size={18} className="text-gray-600" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[1.8rem] text-[12px] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#111319] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="QUERY ARCHIVE..." className="w-full bg-[#111319] border border-gray-800 rounded-2xl py-6 pl-8 pr-16 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600"/>
            <button onClick={handleSendMessage} className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
