'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  ChevronLeft, Loader2, MessageSquare, Send, 
  X, Pencil, Github, Gitlab, Cloud, Terminal, Box, Check, Copy, Zap, Trash2, Eye
} from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Core States
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

  // Code Preview & Sync States
  const [selectedFile, setSelectedFile] = useState<any | null>(null)
  const [fileCopied, setFileCopied] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')

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

  // --- PERSISTENT DELETE LOGIC ---
  const handleDeleteMemory = async (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation() // Prevents opening preview modal
    if (!confirm("Permanently wipe this node from the database?")) return

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
        await loadData()
        setIsSyncModalOpen(false)
        setRepoName('')
      }
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
    } finally { 
      setIsThinking(false) 
    }
  }

  if (loading) return <div className="h-screen bg-[#0a0b0e] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex overflow-hidden relative font-sans">
      
      {/* MAIN VIEWPORT */}
      <div className={`flex-1 p-6 lg:p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-white text-[9px] font-black uppercase mb-12 tracking-[0.2em] group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> BACK TO VAULT
        </button>

        <div className="max-w-5xl mx-auto">
          {/* HEADER SECTION */}
          <header className="bg-[#111319] border border-gray-800/40 p-10 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-start mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-8">
                {isEditing ? (
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleRename} onKeyDown={(e) => e.key === 'Enter' && handleRename()} className="bg-black/50 border border-blue-600 rounded-xl px-4 py-2 text-4xl font-black uppercase text-white outline-none w-full max-w-md"/>
                ) : (
                  <>
                    <h1 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter leading-none">{project?.name}</h1>
                    <button onClick={() => { setEditName(project?.name); setIsEditing(true); }} className="p-2 text-blue-500"><Pencil size={14} /></button>
                  </>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={() => { setActiveProvider('github'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:text-blue-500 transition-all"><Github size={20} /></button>
                <button onClick={() => { setActiveProvider('gitlab'); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:text-orange-500 transition-all"><Gitlab size={20} /></button>
                <button onClick={() => { setActiveProvider('bitbucket' as any); setIsSyncModalOpen(true); }} className="p-3 bg-white/5 rounded-xl hover:text-blue-400 transition-all"><Cloud size={20} /></button>
              </div>
            </div>
            <button onClick={() => setChatOpen(!chatOpen)} className="mt-8 lg:mt-0 bg-blue-600 p-7 rounded-[2.2rem] hover:scale-105 transition-all shadow-xl shadow-blue-900/40 relative">
              <MessageSquare size={32} fill="white" stroke="none" />
              <div className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-bold px-2 py-0.5 rounded-full border-2 border-[#0a0b0e]">LIVE</div>
            </button>
          </header>

          <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-500 mb-8">Archived Nodes</h2>

          {/* MEMORY BLOCKS */}
          <div className="grid grid-cols-1 gap-6 pb-32">
            {memories.map((mem) => (
              <div key={mem.id} onClick={() => setSelectedFile(mem)} className="bg-[#111319] border border-gray-800/40 rounded-[2rem] group hover:border-blue-600/30 transition-all cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-800/20">
                  <div className="flex items-center gap-4">
                    <Terminal size={18} className="text-blue-500"/>
                    <h3 className="text-[10px] font-black uppercase tracking-widest">{mem.file_name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[8px] font-black uppercase px-3 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20">VERIFIED</span>
                    <button onClick={(e) => handleDeleteMemory(e, mem.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <pre className="p-6 bg-black/40 rounded-xl text-[10px] text-gray-500 font-mono overflow-hidden line-clamp-2"><code>{mem.content}</code></pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CODE PREVIEW MODAL --- */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 lg:p-12">
          <div className="bg-[#0a0b0e] border border-gray-800/50 w-full max-w-6xl h-[85vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 bg-[#111319] border-b border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{selectedFile.file_name}</span>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => { navigator.clipboard.writeText(selectedFile.content); setFileCopied(true); setTimeout(() => setFileCopied(false), 2000); }}
                  className="text-[9px] font-black uppercase text-gray-400 hover:text-white flex items-center gap-2"
                >
                  {fileCopied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>} {fileCopied ? 'COPIED' : 'COPY NODE'}
                </button>
                <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
              <pre className="text-[13px] leading-relaxed font-mono text-blue-100/70 whitespace-pre"><code>{selectedFile.content}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* --- SYNC MODAL --- */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative">
            <button onClick={() => setIsSyncModalOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white"><X size={18}/></button>
            <h2 className="text-xl font-black italic uppercase mb-8">{activeProvider} SYNC</h2>
            <input autoFocus value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="owner/repository" className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 mb-6"/>
            <button onClick={handleSyncTrigger} disabled={isSyncing || !repoName.trim()} className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              {isSyncing ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>} {isSyncing ? 'SYNCING...' : 'INITIATE SYNC'}
            </button>
          </div>
        </div>
      )}

      {/* --- SIDEBAR CHAT --- */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-[150] ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">NEURAL HUB</h3>
            <button onClick={() => setChatOpen(false)} className="text-gray-600 hover:text-white"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-[1.5rem] text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#111319] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isThinking && <Loader2 size={16} className="animate-spin text-blue-500" />}
          </div>
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="QUERY ARCHIVE..." className="w-full bg-[#111319] border border-gray-800 rounded-2xl py-6 pl-8 pr-16 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 transition-all"/>
            <button onClick={handleSendMessage} className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
