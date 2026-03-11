'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  ChevronLeft, Loader2, MessageSquare, Send, 
  X, Pencil, Github, Gitlab, Cloud, Terminal, Check, Copy, Zap, Trash2, CheckSquare, Square, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle, Info, FileCode
} from 'lucide-react'

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  
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

  const deployTargets = [
    { name: 'Vercel', status: 'Active' },
    { name: 'AWS', status: 'Ready' },
    { name: 'Azure', status: 'Idle' },
    { name: 'GCP', status: 'Idle' },
    { name: 'Netlify', status: 'Ready' },
    { name: 'Railway', status: 'Idle' }
  ]

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ visible: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }))
    }, 4000)
  }

  const loadData = useCallback(async () => {
    if (!id) return

    try {
      // FIX: Auth check first — if no user, redirect instead of crashing
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data: proj, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // FIX: explicit user_id filter
        .single()

      if (projError || !proj) {
        // Project not found or doesn't belong to user — go back
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

    } catch (err: any) {
      console.error('loadData error:', err)
      router.push('/dashboard/projects')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const handleRename = async () => {
    if (!editName.trim() || editName === project?.name) {
      setIsEditing(false)
      return
    }
    const { error } = await supabase.from('projects').update({ name: editName }).eq('id', id)
    if (!error) {
      setProject({ ...project, name: editName })
      showToast('success', 'Project renamed successfully.')
    } else {
      showToast('error', 'Failed to rename project.')
    }
    setIsEditing(false)
  }

  const confirmDeleteMemory = async () => {
    if (!fileToDelete) return
    setIsDeletingFile(true)
    const { error } = await supabase.from('code_memories').delete().eq('id', fileToDelete.id)
    if (error) {
      showToast('error', `Delete Failed: ${error.message}`)
    } else {
      setMemories(prev => prev.filter(m => m.id !== fileToDelete.id))
      setSelectedForAI(prev => prev.filter(sid => sid !== fileToDelete.id))
      showToast('success', 'File permanently deleted.')
    }
    setIsDeletingFile(false)
    setFileToDelete(null)
  }

  const handleSyncTrigger = async () => {
    if (!repoName.trim()) return
    setIsSyncing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      if (!userId) {
        showToast('error', 'Authentication error.')
        setIsSyncing(false)
        return
      }

      if (memories.length > 0) {
        await supabase.from('code_memories').delete().eq('project_id', id)
      }

      const response = await fetch(`/api/sync/${activeProvider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoName, projectId: id, userId })
      })

      const result = await response.json()

      if (result.upgrade) {
        showToast('error', result.error)
        setIsSyncModalOpen(false)
      } else if (result.success) {
        if (result.capped) {
          showToast('info', `Only ${result.limit} files pulled — upgrade your plan to sync more.`)
        } else if (result.count === 0) {
          showToast('info', 'Sync complete but 0 files pulled. Check repo name.')
        } else {
          showToast('success', `${result.count} files synced. Node is up to date!`)
        }
        await loadData()
        setIsSyncModalOpen(false)
        setRepoName('')
        setSelectedForAI([])
      } else {
        showToast('error', `Sync Error: ${result.error}`)
      }
    } catch {
      showToast('error', 'Network Error: Could not reach sync API.')
    } finally {
      setIsSyncing(false)
    }
  }

  const toggleFileSelection = (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation()
    setSelectedForAI(prev =>
      prev.includes(memoryId) ? prev.filter(sid => sid !== memoryId) : [...prev, memoryId]
    )
  }

  const toggleAllFiles = () => {
    if (selectedForAI.length === memories.length) {
      setSelectedForAI([])
    } else {
      setSelectedForAI(memories.map(m => m.id))
    }
  }

  const toggleFile = (fileId: string) => {
    setExpandedFileId(prev => prev === fileId ? null : fileId)
  }

  const copySelectedForAI = async () => {
    if (selectedForAI.length === 0) return
    const filtered = memories.filter(m => selectedForAI.includes(m.id))
    let output = `# Project Context: "${project?.name}"\n\n`
    filtered.forEach(mem => {
      const ext = mem.file_name.split('.').pop()?.toLowerCase() || ''
      let lang = ext
      if (['ts', 'tsx'].includes(ext)) lang = 'typescript'
      if (['js', 'jsx'].includes(ext)) lang = 'javascript'
      if (ext === 'md') lang = 'markdown'
      output += `### FILE: ${mem.file_name}\n\`\`\`${lang}\n${mem.content}\n\`\`\`\n\n`
    })
    await navigator.clipboard.writeText(output)
    setCopied(true)
    showToast('success', `Copied ${selectedForAI.length} files to clipboard!`)
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, projectId: id })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.response || data.error }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'SYSTEM ERROR: Assistant unreachable.' }])
    } finally {
      setIsThinking(false)
    }
  }

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  if (!project) return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-500">Project not found.</p>
    </div>
  )

  const projectStatus = memories.length === 0 ? 'Grounded' : 'Active'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* TOAST */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none
        ${notification.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}
      >
        <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-md pointer-events-auto
          ${notification.type === 'success' ? 'bg-green-950/80 border-green-500/30 text-green-200' :
            notification.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-200' :
            'bg-blue-950/80 border-blue-500/30 text-blue-200'}`}
        >
          {notification.type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
          {notification.type === 'error' && <AlertCircle size={16} className="text-red-500" />}
          {notification.type === 'info' && <Info size={16} className="text-blue-500" />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(prev => ({...prev, visible: false}))} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className={`flex-1 p-6 md:p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button 
          onClick={() => router.push('/dashboard/projects')} 
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-8 transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Projects
        </button>

        <div className="max-w-5xl mx-auto">
          
          {/* HEADER */}
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
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">{project?.name}</h1>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 ${projectStatus === 'Grounded' ? 'bg-gray-800/80 text-gray-400 border-gray-700' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${projectStatus === 'Grounded' ? 'bg-gray-500' : 'bg-green-500'}`}></div>
                      {projectStatus}
                    </span>
                    <button onClick={() => { setEditName(project?.name); setIsEditing(true); }} className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-10 md:gap-16">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Source</p>
                  <div className="flex gap-3">
                    <button onClick={() => { setActiveProvider('github'); setIsSyncModalOpen(true); }} className="p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-gray-500 transition-all text-gray-300 hover:text-white" title="Sync GitHub">
                      <Github size={18} />
                    </button>
                    <button onClick={() => { setActiveProvider('gitlab'); setIsSyncModalOpen(true); }} className="p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-orange-500 transition-all text-gray-300 hover:text-white" title="Sync GitLab">
                      <Gitlab size={18} />
                    </button>
                    <button onClick={() => { setActiveProvider('bitbucket'); setIsSyncModalOpen(true); }} className="p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-blue-400 transition-all text-gray-300 hover:text-white" title="Sync Bitbucket">
                      <Cloud size={18} />
                    </button>
                  </div>
                </div>

                <div className="hidden md:block w-px bg-gray-800"></div>

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

            <button 
              onClick={() => setChatOpen(!chatOpen)} 
              className="mt-6 md:mt-0 bg-blue-600 p-4 rounded-xl hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center relative group"
            >
              <MessageSquare size={24} className="text-white" />
              <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-md border-2 border-[#111111] text-white">AI</div>
            </button>
          </header>

          {/* VIBE CODING CONTROLS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-[#111111] border border-gray-800 p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Project Files</h2>
              {memories.length > 0 && (
                <button onClick={toggleAllFiles} className="text-xs flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                  {selectedForAI.length === memories.length ? <CheckSquare size={14}/> : <Square size={14}/>}
                  {selectedForAI.length === memories.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <button 
                onClick={copySelectedForAI} 
                disabled={selectedForAI.length === 0}
                className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all justify-center
                  ${copied ? 'bg-green-600 text-white' : 
                    selectedForAI.length === 0 ? 'bg-[#0a0a0a] text-gray-600 cursor-not-allowed border border-gray-800' : 
                    'bg-blue-600 text-white hover:bg-blue-500'}`}
              >
                {copied ? <Check size={14} /> : <Terminal size={14} />}
                {copied ? 'Copied!' : `Copy Selected (${selectedForAI.length})`}
              </button>
            </div>
          </div>

          {/* FILE LIST */}
          <div className="space-y-3 pb-32">
            {memories.length === 0 ? (
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
              memories.map((mem) => {
                const isSelected = selectedForAI.includes(mem.id)
                const isExpanded = expandedFileId === mem.id
                return (
                  <div 
                    key={mem.id} 
                    className={`bg-[#0e1117] border rounded-lg overflow-hidden transition-colors shadow-sm group
                      ${isSelected ? 'border-blue-500/50 bg-blue-950/10' : 'border-gray-800 hover:border-gray-600'}`}
                  >
                    <div 
                      onClick={() => toggleFile(mem.id)}
                      className={`flex justify-between items-center px-4 py-3 cursor-pointer transition-colors
                        ${isSelected ? 'bg-blue-900/10' : 'bg-[#161b22] hover:bg-gray-800/30'}
                        ${isExpanded ? 'border-b border-gray-800/50' : ''}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div onClick={(e) => toggleFileSelection(e, mem.id)} className="p-1 -ml-1 cursor-pointer text-gray-500 hover:text-white transition-colors">
                          {isSelected ? <CheckSquare size={16} className="text-blue-500"/> : <Square size={16}/>}
                        </div>
                        <FileCode className="text-blue-500 flex-shrink-0" size={16} />
                        <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-blue-100' : 'text-gray-200'}`}>
                          {mem.file_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => copyIndividualBlock(e, mem.content, mem.id)} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors bg-[#0a0a0a] border border-gray-800">
                          {individualCopiedId === mem.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setFileToDelete({ id: mem.id, name: mem.file_name }) }} className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors bg-[#0a0a0a] border border-gray-800">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 bg-[#0d1117] overflow-x-auto">
                        <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap">
                          <code>{mem.content}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

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
              <h2 className="text-xl font-semibold capitalize text-white">{memories.length > 0 ? 'Update Sync' : `${activeProvider} Sync`}</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              {memories.length > 0 
                ? 'This will replace your current project files with the latest from the repository.'
                : 'Enter the repository name to pull its code into this project.'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Repository</label>
                <input 
                  autoFocus
                  value={repoName} 
                  onChange={(e) => setRepoName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && !isSyncing && repoName.trim() && handleSyncTrigger()}
                  placeholder="e.g., owner/repo"
                  className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder:text-gray-700"
                />
              </div>
              <button 
                onClick={handleSyncTrigger} 
                disabled={isSyncing || !repoName.trim()}
                className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${isSyncing || !repoName.trim() ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {isSyncing ? <><Loader2 size={16} className="animate-spin"/> Syncing...</> : memories.length > 0 ? <><RefreshCw size={16}/> Pull Updates</> : <><Zap size={16}/> Pull Files</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILE DELETE MODAL */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-red-900/30 w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete File?</h2>
              <p className="text-sm text-gray-400 mb-1">
                You are about to permanently remove <strong className="text-gray-200">{fileToDelete.name}</strong> from this node's memory.
              </p>
              <p className="text-sm text-gray-400">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-6 md:px-8 pb-6 md:pb-8">
              <button onClick={() => setFileToDelete(null)} disabled={isDeletingFile} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#161b22] hover:bg-gray-800 text-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteMemory} disabled={isDeletingFile} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2">
                {isDeletingFile ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Delete'}
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
            <button onClick={() => setChatOpen(false)} className="p-1.5 hover:bg-gray-800 rounded-md transition-colors">
              <X size={18} className="text-gray-400 hover:text-white" />
            </button>
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
