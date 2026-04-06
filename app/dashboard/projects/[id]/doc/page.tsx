'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  ChevronLeft, Loader2, MessageSquare, Send, 
  X, Pencil, Github, Gitlab, Cloud, Terminal, Check, Copy, Trash2, 
  CheckSquare, Square, RefreshCw, AlertTriangle, CheckCircle2, 
  AlertCircle, Info, FileCode, Download, Folder, FolderOpen, ChevronDown, ChevronRight, Search
} from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ visible: boolean, type: 'success' | 'error' | 'info', message: string }>({ visible: false, type: 'info', message: '' })
  const [fileToDelete, setFileToDelete] = useState<{ id: string, name: string } | null>(null)
  const [isDeletingFile, setIsDeletingFile] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')
  const [selectedForAI, setSelectedForAI] = useState<string[]>([])

  // --- NEW: Sorting Shelf State ---
  const [fileSearch, setFileSearch] = useState('')
  const [collapsedShelves, setCollapsedShelves] = useState<Set<string>>(new Set())

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ visible: true, type, message })
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 4000)
  }, [])

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data: proj, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (projError || !proj) {
        router.push('/dashboard/projects')
        return
      }

      setProject(proj)
      const { data: mems } = await supabase
        .from('code_memories')
        .select('*')
        .eq('project_id', id)
        .order('file_name', { ascending: true })
      if (mems) setMemories(mems)
    } catch (err) {
      console.error('loadData error:', err)
      router.push('/dashboard/projects')
    } finally {
      setLoading(false)
    }
  }, [id, router, supabase])

  useEffect(() => { loadData() }, [loadData])

  // --- NEW: Sorting Shelf Logic ---
  const { groups, sortedFolders } = useMemo(() => {
    const filtered = memories.filter(m => m.file_name.toLowerCase().includes(fileSearch.toLowerCase()))
    const g: Record<string, any[]> = {}
    
    filtered.forEach(mem => {
      const parts = mem.file_name.split('/')
      const isRoot = parts.length === 1
      const folder = isRoot ? 'Root' : parts.slice(0, -1).join('/')
      if (!g[folder]) g[folder] = []
      g[folder].push(mem)
    })
    
    const sorted = Object.keys(g).sort((a, b) => {
      if (a === 'Root') return -1
      if (b === 'Root') return 1
      return a.localeCompare(b)
    })
    
    return { groups: g, sortedFolders: sorted }
  }, [memories, fileSearch])

  const toggleShelf = (folder: string) => {
    setCollapsedShelves(prev => {
      const next = new Set(prev)
      if (next.has(folder)) next.delete(folder)
      else next.add(folder)
      return next
    })
  }
  // ---------------------------------

  const handleRename = async () => {
    if (!editName.trim() || editName === project?.name) return setIsEditing(false)
    const { error } = await supabase.from('projects').update({ name: editName }).eq('id', id)
    if (!error) {
      setProject((prev: any) => ({ ...prev, name: editName }))
      showToast('success', 'Project renamed.')
    }
    setIsEditing(false)
  }

  const confirmDeleteMemory = async () => {
    if (!fileToDelete) return
    setIsDeletingFile(true)
    const { error } = await supabase.from('code_memories').delete().eq('id', fileToDelete.id)
    if (!error) {
      setMemories(prev => prev.filter(m => m.id !== fileToDelete.id))
      setSelectedForAI(prev => prev.filter(sid => sid !== fileToDelete.id))
      showToast('success', 'File deleted.')
    }
    setIsDeletingFile(false)
    setFileToDelete(null)
  }

  const handleSyncTrigger = async () => {
    if (!repoName.trim()) return
    setIsSyncing(true)
    
    const isUpdate = memories.length > 0
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) return router.push('/login')
      const response = await fetch(`/api/sync/${activeProvider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoName, projectId: id, userId: user.id })
      })
      const result = await response.json()

      if (result.success) {
        const successMessage = isUpdate
          ? `Repository updated! ${result.count} files refreshed.`
          : `Repository synced! ${result.count} files pulled.`
        showToast(result.capped ? 'info' : 'success', result.capped ? `Only ${result.limit} files pulled — upgrade plan to sync more.` : successMessage)
        await loadData()
        setIsSyncModalOpen(false)
        setRepoName('')
      } else if (result.upgrade) {
        showToast('error', result.error || 'Upgrade your plan to sync more files.')
      } else {
        showToast('error', result.error || 'Sync failed.')
      }
    } catch {
      showToast('error', 'Network Error')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDownloadFile = (e: React.MouseEvent, fileName: string, content: string) => {
    e.stopPropagation()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = fileName; a.click()
    window.URL.revokeObjectURL(url)
    showToast('info', `Downloading ${fileName}...`)
  }

  const toggleFileSelection = (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation()
    setSelectedForAI(prev => prev.includes(memoryId) ? prev.filter(sid => sid !== memoryId) : [...prev, memoryId])
  }

  const copySelectedForAI = async () => {
    if (selectedForAI.length === 0) return
    const filtered = memories.filter(m => selectedForAI.includes(m.id))
    let output = `# Project Context: "${project?.name}"\n\n`
    filtered.forEach(mem => {
      const ext = mem.file_name.split('.').pop()?.toLowerCase() || ''
      output += `### FILE: ${mem.file_name}\n\`\`\`${ext}\n${mem.content}\n\`\`\`\n\n`
    })
    await navigator.clipboard.writeText(output)
    setCopied(true)
    showToast('success', `Copied ${selectedForAI.length} files!`)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyIndividualBlock = (e: React.MouseEvent, content: string, memId: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(content)
    setIndividualCopiedId(memId)
    setTimeout(() => setIndividualCopiedId(null), 2000)
  }

  const handleSendMessage = async () => {
    if (!query.trim() || isThinking) return
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setIsThinking(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, projectId: id, userId: user?.id })
      })
      const data = await res.json()
      if (data.error) {
        setMessages(prev => [...prev, { role: 'ai', content: `[Error]: ${data.error}` }])
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: `[SYSTEM ERROR]: Connection lost.` }])
    } finally {
      setIsThinking(false)
    }
  }

  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded-md border border-blue-500/30 font-mono text-xs shadow-sm">{part.slice(1, -1)}</code>
      }
      return <span key={i}>{part}</span>
    })
  }

  const renderPremiumText = (text: string) => {
    const segments = text.split(/(```[\s\S]*?```)/g)
    return segments.map((segment, index) => {
      if (segment.startsWith('```') && segment.endsWith('```')) {
        const content = segment.slice(3, -3)
        const firstNewLine = content.indexOf('\n')
        const lang = firstNewLine !== -1 ? content.slice(0, firstNewLine).trim() : ''
        const code = firstNewLine !== -1 ? content.slice(firstNewLine + 1) : content

        return (
          <div key={index} className="my-5 rounded-xl border border-[#1E293B] bg-[#020617] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0B1120] border-b border-[#1E293B]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              {lang && <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{lang}</span>}
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm font-mono text-cyan-300 leading-relaxed"><code>{code}</code></pre>
            </div>
          </div>
        )
      }

      return (
        <div key={index} className="space-y-4 text-zinc-300 text-sm leading-relaxed">
          {segment.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2"></div>
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
              return (
                <div key={i} className="flex gap-3 ml-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{formatInlineText(line.substring(2))}</span>
                </div>
              )
            }
            return <p key={i}>{formatInlineText(line)}</p>
          })}
        </div>
      )
    })
  }

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex overflow-hidden font-sans selection:bg-blue-500/30">
      
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] transition-all duration-300 pointer-events-none ${notification.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
        <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-md pointer-events-auto ${notification.type === 'success' ? 'bg-green-950/80 border-green-500/30 text-green-200' : notification.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-200' : 'bg-blue-950/80 border-blue-500/30 text-blue-200'}`}>
          {notification.type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
          {notification.type === 'error' && <AlertCircle size={16} className="text-red-500" />}
          {(notification.type === 'info' || !notification.type) && <Info size={16} className="text-blue-500" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      </div>

      <div className={`flex-1 p-6 md:p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'hidden md:block md:mr-[450px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-8 transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Vault
        </button>

        <div className="max-w-5xl mx-auto">
          <header className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start mb-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />
            <div className="flex-1 w-full relative z-10">
              <div className="flex items-center gap-4 mb-8">
                {isEditing ? (
                  <div className="flex items-center gap-3 w-full max-w-md">
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename()} className="bg-black border border-blue-500/50 rounded-lg px-4 py-2 text-xl md:text-2xl font-semibold text-white outline-none w-full focus:border-blue-500 transition-colors"/>
                    <button onClick={handleRename} className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Check size={18} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-4xl font-semibold text-white tracking-tight">{project?.name}</h1>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 ${memories.length === 0 ? 'bg-gray-900/50 text-gray-400 border-gray-800' : 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${memories.length === 0 ? 'bg-gray-500' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]'}`}></div>
                      {memories.length === 0 ? 'Grounded' : 'Active'}
                    </span>
                    <button onClick={() => { setEditName(project?.name); setIsEditing(true); }} className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/5 transition-colors"><Pencil size={14} /></button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Source</p>
                <div className=\"flex gap-3\">
                  <button onClick={() => { setActiveProvider('github'); setIsSyncModalOpen(true); }} className="p-2.5 bg-[#111] border border-gray-800 rounded-lg hover:border-white/30 transition-all text-gray-400 hover:text-white"><Github size={18} /></button>
                  <button onClick={() => { setActiveProvider('gitlab'); setIsSyncModalOpen(true); }} className="p-2.5 bg-[#111] border border-gray-800 rounded-lg hover:border-orange-500/50 transition-all text-gray-400 hover:text-orange-400"><Gitlab size={18} /></button>
                  <button onClick={() => { setActiveProvider('bitbucket'); setIsSyncModalOpen(true); }} className="p-2.5 bg-[#111] border border-gray-800 rounded-lg hover:border-blue-500/50 transition-all text-gray-400 hover:text-blue-400"><Cloud size={18} /></button>
                </div>
              </div>
            </div>

            <button onClick={() => setChatOpen(!chatOpen)} className="absolute top-6 right-6 md:relative md:top-0 md:right-0 bg-blue-600 p-3 md:p-4 rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center group z-10">
              <MessageSquare size={20} className="text-white md:w-6 md:h-6" />
              <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-md border-2 border-[#111111] text-white">AI</div>
            </button>
          </header>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-[#0a0a0a] border border-gray-800 p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider shrink-0">Project Files</h2>
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Filter codebase..."
                  value={fileSearch}
                  onChange={e => setFileSearch(e.target.value)}
                  className="w-full bg-[#111] border border-gray-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {memories.length > 0 && (
                <button onClick={() => setSelectedForAI(selectedForAI.length === memories.length ? [] : memories.map(m => m.id))} className="text-xs flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors shrink-0">
                  {selectedForAI.length === memories.length ? <CheckSquare size={14}/> : <Square size={14}/>} Select All
                </button>
              )}
              <button onClick={copySelectedForAI} disabled={selectedForAI.length === 0} className={`flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto rounded-lg text-xs font-medium transition-all ${copied ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' : selectedForAI.length === 0 ? 'bg-[#111] text-gray-600 cursor-not-allowed border border-gray-800' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]'}`}>
                {copied ? <Check size={14} /> : <Terminal size={14} />} {copied ? 'Copied!' : `Copy Selected (${selectedForAI.length})`}
              </button>
            </div>
          </div>

          <div className="space-y-4 pb-32">
            {memories.length === 0 ? (
              <div className="p-12 text-center border border-gray-800 border-dashed rounded-xl bg-gray-900/10">
                <p className="text-sm text-gray-500 mb-4">No files synced yet. Connect a repository above to pull your code.</p>
              </div>
            ) : sortedFolders.length === 0 ? (
               <div className="p-8 text-center text-gray-500 text-sm">No files match your search.</div>
            ) : (
              sortedFolders.map(folder => {
                const isCollapsed = collapsedShelves.has(folder)
                const isRoot = folder === 'Root'
                
                return (
                  <div key={folder} className="mb-2">
                    {/* Shelf Header */}
                    <div 
                      onClick={() => toggleShelf(folder)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all border shadow-sm ${isRoot ? 'bg-fuchsia-500/5 border-fuchsia-500/20 hover:bg-fuchsia-500/10' : 'bg-[#111] border-gray-800 hover:bg-gray-800/80'}`}
                    >
                      {isCollapsed ? <ChevronRight size={16} className="text-gray-500 shrink-0" /> : <ChevronDown size={16} className={isRoot ? "text-fuchsia-400 shrink-0" : "text-blue-400 shrink-0"} />}
                      {isRoot ? <FolderOpen size={16} className="text-fuchsia-500 shrink-0" /> : <Folder size={16} className="text-blue-500 shrink-0" />}
                      <span className={`text-xs font-bold uppercase tracking-wider truncate ${isRoot ? 'text-fuchsia-100' : 'text-gray-200'}`}>{folder}</span>
                      <span className="text-[10px] text-gray-500 font-mono ml-auto bg-black/50 px-2 py-0.5 rounded shrink-0">{groups[folder].length} files</span>
                    </div>

                    {/* Files in Shelf */}
                    {!isCollapsed && (
                      <div className="space-y-1.5 pl-3 md:pl-6 border-l-2 border-gray-800/30 ml-2 md:ml-4 mt-1.5 pt-1.5">
                        {groups[folder].map((mem: any) => {
                          const isSelected = selectedForAI.includes(mem.id)
                          const isExpanded = expandedFileId === mem.id
                          // Only show the actual filename, without the long path prefix
                          const displayFileName = isRoot ? mem.file_name : mem.file_name.split('/').pop()

                          return (
                            <div key={mem.id} className={`bg-[#0a0a0a] border rounded-lg overflow-hidden transition-colors shadow-sm group ${isSelected ? 'border-blue-500/50 bg-blue-950/10 shadow-[0_0_15px_rgba(37,99,235,0.1)]' : isRoot ? 'border-gray-700 hover:border-gray-500' : 'border-gray-800 hover:border-gray-600'}`}>
                              <div onClick={() => setExpandedFileId(prev => prev === mem.id ? null : mem.id)} className={`flex justify-between items-center px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/10' : 'bg-[#111] hover:bg-gray-800/50'} ${isExpanded ? 'border-b border-gray-800/50' : ''}`}>
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                  <div onClick={(e) => toggleFileSelection(e, mem.id)} className="p-1 -ml-1 cursor-pointer text-gray-500 hover:text-white transition-colors">
                                    {isSelected ? <CheckSquare size={16} className="text-blue-500"/> : <Square size={16}/>}
                                  </div>
                                  <FileCode className="text-blue-500 flex-shrink-0" size={16} />
                                  <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-blue-100' : isRoot ? 'text-white font-semibold' : 'text-gray-400'}`}>
                                    {displayFileName}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => handleDownloadFile(e, mem.file_name, mem.content)} className="p-1.5 text-gray-400 hover:text-blue-400 rounded-md hover:bg-blue-500/10 transition-colors bg-[#050505] border border-gray-800"><Download size={14} /></button>
                                  <button onClick={(e) => copyIndividualBlock(e, mem.content, mem.id)} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors bg-[#050505] border border-gray-800">{individualCopiedId === mem.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}</button>
                                  <button onClick={(e) => { e.stopPropagation(); setFileToDelete({ id: mem.id, name: mem.file_name }) }} className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors bg-[#050505] border border-gray-800"><Trash2 size={14}/></button>
                                </div>
                              </div>
                              {isExpanded && <div className="p-4 bg-[#050505] overflow-x-auto"><pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap"><code>{mem.content}</code></pre></div>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className={`fixed right-0 top-0 h-full w-full md:w-[500px] bg-[#0A0A0A] border-l border-gray-800 shadow-2xl transition-transform duration-300 z-50 flex flex-col ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#0A0A0A]/80 backdrop-blur-md z-10">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div> 
            Neural Node Intelligence
          </h3>
          <button onClick={() => setChatOpen(false)} className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"><X size={18} className="text-gray-400 hover:text-white" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <MessageSquare size={32} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-300 font-medium mb-1">System Ready</p>
                <p className="text-xs text-gray-500">Ask strict technical questions about your synced code.</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[95%] sm:max-w-[85%] p-5 rounded-2xl shadow-xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-[#111111] border border-gray-800 text-gray-300 rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
              }`}>
                {msg.role === 'user' ? (
                  <span className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</span>
                ) : (
                  <div className="font-sans text-sm">
                    {renderPremiumText(msg.content)}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-[#111111] border border-gray-800 p-4 rounded-xl rounded-bl-sm flex items-center gap-3 shadow-lg">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span className="text-xs text-gray-500 font-mono">Analyzing architecture...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-[#0A0A0A] border-t border-gray-800">
          <div className="relative">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Query the codebase..." 
              className="w-full bg-[#111] border border-gray-800 rounded-xl py-4 pl-5 pr-14 text-sm text-white outline-none focus:border-blue-500 focus:bg-[#161b22] transition-all shadow-inner"
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!query.trim() || isThinking} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-all shadow-md"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-gray-800 w-full max-w-md rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white capitalize">Sync {activeProvider}</h3>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase mb-2 block">Repository Name (e.g., owner/repo)</label>
                <input value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="username/repository" className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>
            <div className="p-6 bg-[#050505] border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setIsSyncModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 text-gray-300 transition-colors">Cancel</button>
              <button onClick={handleSyncTrigger} disabled={!repoName.trim() || isSyncing} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 disabled:opacity-50">
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sync Now
              </button>
            </div>
          </div>
        </div>
      )}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-red-900/30 w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto"><AlertTriangle className="text-red-500" size={24} /></div>
              <h2 className="text-xl font-bold text-white mb-2">Delete File?</h2>
              <p className="text-sm text-gray-400 mb-1">Permanently remove <strong className="text-gray-200">{fileToDelete.name}</strong>?</p>
            </div>
            <div className="flex gap-3 px-8 pb-8">
              <button onClick={() => setFileToDelete(null)} disabled={isDeletingFile} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#161b22] hover:bg-gray-800 text-gray-300 transition-colors">Cancel</button>
              <button onClick={confirmDeleteMemory} disabled={isDeletingFile} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2">{isDeletingFile ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
