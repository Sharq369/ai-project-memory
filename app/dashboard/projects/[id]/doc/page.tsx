'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  ChevronLeft, Loader2, MessageSquare, Send, 
  X, Pencil, Github, Gitlab, Cloud, Terminal, Check, Copy, Zap, Trash2
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
  const [individualCopiedId, setIndividualCopiedId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<any | null>(null)

  // --- SYNC ENGINE STATE ---
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')

  // Deployment Targets
  const deployTargets = [
    { name: 'Vercel', status: 'Active' },
    { name: 'AWS', status: 'Ready' },
    { name: 'Azure', status: 'Idle' },
    { name: 'GCP', status: 'Idle' },
    { name: 'Netlify', status: 'Ready' },
    { name: 'Railway', status: 'Idle' }
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
    if (!confirm("Are you sure you want to permanently delete this file?")) return

    const { error } = await supabase
      .from('code_memories')
      .delete()
      .eq('id', memoryId)

    if (error) {
      alert(`Delete Failed: ${error.message}`)
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
        if (result.count === 0) {
           alert("Sync completed, but 0 files were pulled. Make sure your repo name is exact (e.g., owner/repo).")
        } else {
           alert(`Success: ${result.count} files synchronized to your project.`)
        }
        await loadData()
        setIsSyncModalOpen(false)
        setRepoName('')
      } else {
        alert(`Sync API Error: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Network Error: Failed to reach the sync API. ${err.message}`)
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
      setMessages(prev => [...prev, { role: 'ai', content: "SYSTEM ERROR: Assistant unreachable." }])
    } finally { 
      setIsThinking(false) 
    }
  }

  const copyNeuralContext = async () => {
    if (memories.length === 0) return
    const contextHeader = `Project Context: "${project?.name}"\n`
    const contextBody = memories.map(mem => (`FILE: ${mem.file_name}\nCONTENT:\n${mem.content}\n---`)).join('\n')
    await navigator.clipboard.writeText(`${contextHeader}\n${contextBody}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyIndividualBlock = (e: React.MouseEvent, content: string, memId: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(content)
    setIndividualCopiedId(memId)
    setTimeout(() => setIndividualCopiedId(null), 2000)
  }

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 p-6 md:p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button 
          onClick={() => router.push('/dashboard/projects')} 
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-8 transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Projects
        </button>

        <div className="max-w-5xl mx-auto">
          
          {/* HEADER DASHBOARD */}
          <header className="bg-[#111111] border border-gray-800 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start mb-10 shadow-sm">
            <div className="flex-1 w-full">
              
              <div className="flex items-center gap-4 mb-8">
                {isEditing ? (
                  <div className="flex items-center gap-3 w-full max-w-md">
                    <input 
                      autoFocus 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleRename()} 
                      className="bg-black border border-blue-500/50 rounded-lg px-4 py-2 text-2xl font-semibold text-white outline-none w-full focus:border-blue-500 transition-colors"
                    />
                    <button onClick={handleRename} className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Check size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">{project?.name}</h1>
                    <button onClick={() => { setEditName(project?.name); setIsEditing(true); }} className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-10 md:gap-16">
                {/* Source Protocols */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Source</p>
                  <div className="flex gap-3">
                    <button onClick={() => { setActiveProvider('github'); setIsSyncModalOpen(true); }} className="p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-gray-500 transition-all text-gray-300 hover:text-white">
                      <Github size={18} />
                    </button>
                    <button onClick={() => { setActiveProvider('gitlab'); setIsSyncModalOpen(true); }} className="p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-orange-500 transition-all text-gray-300 hover:text-white">
                      <Gitlab size={18} />
                    </button>
                    <button onClick={() => { setActiveProvider('bitbucket'); setIsSyncModalOpen(true); }} className="p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-blue-400 transition-all text-gray-300 hover:text-white">
                      <Cloud size={18} />
                    </button>
                  </div>
                </div>

                <div className="hidden md:block w-px bg-gray-800"></div>

                {/* Deployment Manifest */}
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Deployments</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {deployTargets.map((target) => (
                      <div key={target.name} className="flex items-center justify-between px-3 py-2 bg-black/50 border border-gray-800 rounded-lg">
                        <span className="text-xs font-medium text-gray-400">{target.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${target.status === 'Active' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-gray-700'}`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CHAT TOGGLE BUTTON */}
            <button 
              onClick={() => setChatOpen(!chatOpen)} 
              className="mt-6 md:mt-0 bg-blue-600 p-4 rounded-xl hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center relative group"
            >
              <MessageSquare size={24} className="text-white" />
              <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-md border-2 border-[#111111] text-white">AI</div>
            </button>
          </header>

          {/* LIST HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-300">Project Files</h2>
            <button 
              onClick={copyNeuralContext} 
              disabled={memories.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${copied ? 'bg-green-600 text-white' : memories.length === 0 ? 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800' : 'bg-[#111111] border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Context Copied' : 'Copy All Context'}
            </button>
          </div>

          {/* PROFESSIONAL FILE LIST UI */}
          <div className="space-y-4 pb-32">
            {memories.length === 0 && !loading ? (
              <div className="p-12 text-center border border-gray-800 border-dashed rounded-xl bg-gray-900/20">
                <p className="text-sm text-gray-500 mb-4">No files synced yet. Connect a repository above to pull your code.</p>
                <button 
                  onClick={() => setIsSyncModalOpen(true)} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Zap size={16} /> Sync First Repository
                </button>
              </div>
            ) : (
              memories.map((mem) => (
                <div 
                  key={mem.id} 
                  onClick={() => setSelectedFile(mem)} 
                  className="bg-[#0e1117] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-600 transition-colors cursor-pointer shadow-sm group"
                >
                  {/* File Header */}
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800/50 bg-[#161b22]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Terminal size={14} className="text-blue-400 flex-shrink-0"/>
                      <h3 className="text-sm font-medium text-gray-200 truncate">{mem.file_name}</h3>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 mr-2">
                        Synced
                      </span>
                      <button 
                        onClick={(e) => copyIndividualBlock(e, mem.content, mem.id)} 
                        className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors"
                        title="Copy code"
                      >
                         {individualCopiedId === mem.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                      <button 
                        onClick={(e) => handleDeleteMemory(e, mem.id)} 
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
                        title="Delete file"
                      >
                         <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                  
                  {/* Code Preview */}
                  <div className="p-4 bg-[#0d1117]">
                    <pre className="text-xs font-mono text-gray-400 overflow-hidden line-clamp-3">
                      <code>{mem.content}</code>
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CODE PREVIEW MODAL */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-[#0e1117] border border-gray-800 w-full max-w-5xl h-[85vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-[#161b22] border-b border-gray-800">
              <span className="text-sm font-medium text-gray-200 truncate pr-4">{selectedFile.file_name}</span>
              <button onClick={() => setSelectedFile(null)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-md transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#0d1117]">
              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap break-words">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SYNC MODAL */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-gray-800 w-full max-w-md rounded-xl p-8 relative shadow-2xl">
            <button onClick={() => setIsSyncModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <X size={20}/>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              {activeProvider === 'github' && <Github className="text-gray-200" size={24}/>}
              {activeProvider === 'gitlab' && <Gitlab className="text-orange-500" size={24}/>}
              {activeProvider === 'bitbucket' && <Cloud className="text-blue-400" size={24}/>}
              <h2 className="text-xl font-semibold capitalize text-white">{activeProvider} Sync</h2>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">Enter the repository name to pull its code into this project.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Repository</label>
                <input 
                  autoFocus
                  value={repoName} 
                  onChange={(e) => setRepoName(e.target.value)} 
                  placeholder="e.g., facebook/react"
                  className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder:text-gray-700"
                />
              </div>
              
              <button 
                onClick={handleSyncTrigger} 
                disabled={isSyncing || !repoName.trim()}
                className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${isSyncing || !repoName.trim() ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
              >
                {isSyncing ? <><Loader2 size={16} className="animate-spin"/> Syncing Repository...</> : <><Zap size={16}/> Pull Files</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT SIDEBAR */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#0a0a0a] border-l border-gray-800 shadow-2xl transition-transform duration-300 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6 sm:p-8">
          
          <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> AI Assistant
            </h3>
            <button onClick={() => setChatOpen(false)} className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"><X size={18} className="text-gray-400 hover:text-white" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-3">
                <MessageSquare size={32} className="text-gray-500" />
                <p className="text-sm text-gray-400">Ask questions about your synced code files.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#111111] border border-gray-800 text-gray-300 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-[#111111] border border-gray-800 p-4 rounded-xl rounded-bl-sm">
                  <Loader2 size={16} className="animate-spin text-gray-500" />
                </div>
              </div>
            )}
          </div>
          
          <div className="relative mt-auto">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Ask about this project..." 
              className="w-full bg-[#111111] border border-gray-800 rounded-lg py-3.5 pl-4 pr-12 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!query.trim() || isThinking}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-500 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
