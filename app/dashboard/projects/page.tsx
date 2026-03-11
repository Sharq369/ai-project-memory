'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Plus, FolderGit2, Trash2, ArrowRight, Loader2, 
  AlertTriangle, Activity, RefreshCw, Github, Gitlab, 
  Cloud, Zap, X, CheckCircle2, AlertCircle, Info 
} from 'lucide-react'

export default function ProjectsDashboard() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Custom Premium Alert/Confirm State
  const [nodeToDelete, setNodeToDelete] = useState<{ id: string, name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Premium UI States for Sync
  const [notification, setNotification] = useState<{ visible: boolean, type: 'success' | 'error' | 'info', message: string }>({ visible: false, type: 'info', message: '' })
  
  // Sync Engine State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null)
  const [repoName, setRepoName] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ visible: true, type, message })
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 4000)
  }

  const fetchProjects = async () => {
    try {
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projError) {
        showToast('error', `Failed to load projects: ${projError.message}`)
        return
      }

      if (projData) {
        const { data: memData } = await supabase
          .from('code_memories')
          .select('id, project_id')

        const mergedProjects = projData.map(project => ({
          ...project,
          code_memories: memData ? memData.filter(m => m.project_id === project.id) : []
        }))
        
        setProjects(mergedProjects)
      }
    } catch (err) {
      console.error("Network or unexpected error:", err)
      showToast('error', "Network error while loading vault.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // PASTE THIS INSIDE app/dashboard/projects/page.tsx

const handleCreateProject = async () => {
  setCreating(true)

  // 1. Get logged in user
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  if (!userId) {
    showToast('error', 'You must be logged in.')
    setCreating(false)
    return
  }

  // 2. Check plan limit before creating
  const check = await fetch('/api/enforce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action: 'create_project' })
  })
  const result = await check.json()

  if (!result.allowed) {
    showToast('error', result.reason)
    setCreating(false)
    return
  }

  // 3. Create the project
  const { data, error } = await supabase
    .from('projects')
    .insert({ name: 'New Neural Node', user_id: userId })
    .select()
    .single()

  if (error) {
    showToast('error', `Database Error: ${error.message}`)
    setCreating(false)
  } else if (data) {
    router.push(`/dashboard/projects/${data.id}/doc`)
  }
}

  const confirmDecommission = async () => {
    if (!nodeToDelete) return
    setIsDeleting(true)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', nodeToDelete.id)

    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== nodeToDelete.id))
      showToast('success', 'Node decommissioned.')
    } else {
      showToast('error', `Delete Error: ${error.message}`)
    }
    
    setIsDeleting(false)
    setNodeToDelete(null)
  }

  // Handle Sync from Dashboard
  const handleSyncTrigger = async () => {
    if (!repoName.trim() || !syncingProjectId) return
    setIsSyncing(true)
    
    try {
      const projectToSync = projects.find(p => p.id === syncingProjectId)
      if (projectToSync && projectToSync.code_memories?.length > 0) {
        await supabase.from('code_memories').delete().eq('project_id', syncingProjectId)
      }

      const response = await fetch(`/api/sync/${activeProvider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoName, projectId: syncingProjectId })
      })

      const result = await response.json()
      
      if (result.success) {
        if (result.count === 0) {
           showToast('info', "Sync completed, but 0 files were pulled. Check repository name.")
        } else {
           showToast('success', `${result.count} files pulled. Node is up to date!`)
        }
        await fetchProjects() // Reload UI with fresh counts
        setIsSyncModalOpen(false)
        setRepoName('')
        setSyncingProjectId(null)
      } else {
        showToast('error', `Sync API Error: ${result.error}`)
      }
    } catch (err: any) {
      showToast('error', `Network Error: Failed to reach the sync API.`)
    } finally {
      setIsSyncing(false)
    }
  }

  const heatMapData = useMemo(() => {
    return Array.from({ length: 84 }).map((_, i) => {
      const isRecent = i > 60
      const randomSeed = Math.random()
      let level = 0
      
      if (isRecent) {
        level = randomSeed > 0.3 ? Math.floor(Math.random() * 4) : 0
      } else {
        level = randomSeed > 0.7 ? Math.floor(Math.random() * 3) : 0
      }
      return level 
    })
  }, [])

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12 font-sans selection:bg-blue-500/30 relative">
      
      {/* PREMIUM TOAST NOTIFICATION */}
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

      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Project Vault</h1>
            <p className="text-sm text-gray-500">Manage and sync your AI context nodes.</p>
          </div>
          <button 
            onClick={handleCreateProject}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Initialize Node
          </button>
        </header>

        {/* ACTIVITY HEAT MAP */}
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="flex-shrink-0 z-10">
            <div className="flex items-center gap-2 text-white font-medium mb-1">
              <Activity size={18} className="text-blue-500" /> Neural Activity
            </div>
            <p className="text-xs text-gray-500">Context injected over the last 12 weeks</p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto z-10">
            <div className="grid grid-rows-7 grid-flow-col gap-1.5">
              {heatMapData.map((level, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-[2px] transition-colors duration-300 hover:ring-1 hover:ring-white/50 cursor-crosshair
                    ${level === 0 ? 'bg-gray-800/40' : 
                      level === 1 ? 'bg-blue-900/60' : 
                      level === 2 ? 'bg-blue-600/80' : 
                      'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'}`}
                  title={`Activity level: ${level}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* PROJECT GRID */}
        {projects.length === 0 ? (
          <div className="border border-gray-800 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-[#111111]/50">
            <FolderGit2 size={48} className="text-gray-700 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Vault Empty</h3>
            <p className="text-gray-500 max-w-sm mb-6">Initialize your first neural node to start syncing code repositories for AI context.</p>
            <button onClick={handleCreateProject} className="text-blue-500 hover:text-blue-400 font-medium text-sm flex items-center gap-2 transition-colors">
              Create your first project <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const fileCount = project.code_memories?.length || 0
              const isGrounded = fileCount === 0

              return (
                <div 
                  key={project.id} 
                  onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)}
                  className="bg-[#111111] border border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] group relative flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
                      <FolderGit2 size={24} />
                    </div>
                    
                    {/* ACTION BUTTONS ON CARD */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSyncingProjectId(project.id)
                          setIsSyncModalOpen(true)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Sync Repository"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setNodeToDelete({ id: project.id, name: project.name })
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Node"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2 truncate pr-4">{project.name}</h3>
                  
                  <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-800/50">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 ${isGrounded ? 'bg-gray-800/50 text-gray-400 border-gray-800' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isGrounded ? 'bg-gray-500' : 'bg-green-500'}`}></div>
                      {isGrounded ? 'Grounded' : 'Active'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {fileCount} {fileCount === 1 ? 'File' : 'Files'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* SYNC/UPDATE MODAL FOR DASHBOARD */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-gray-800 w-full max-w-md rounded-xl p-8 relative shadow-2xl scale-in-95">
            <button onClick={() => { setIsSyncModalOpen(false); setSyncingProjectId(null); }} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <X size={20}/>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              {activeProvider === 'github' && <Github className="text-gray-200" size={24}/>}
              {activeProvider === 'gitlab' && <Gitlab className="text-orange-500" size={24}/>}
              {activeProvider === 'bitbucket' && <Cloud className="text-blue-400" size={24}/>}
              <h2 className="text-xl font-semibold capitalize text-white">Project Sync</h2>
            </div>
            
            <div className="flex gap-2 mb-6">
              <button onClick={() => setActiveProvider('github')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${activeProvider === 'github' ? 'bg-white/10 border-gray-500 text-white' : 'bg-[#0f1117] border-gray-800 text-gray-500 hover:text-gray-300'}`}>GitHub</button>
              <button onClick={() => setActiveProvider('gitlab')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${activeProvider === 'gitlab' ? 'bg-white/10 border-orange-500 text-white' : 'bg-[#0f1117] border-gray-800 text-gray-500 hover:text-gray-300'}`}>GitLab</button>
              <button onClick={() => setActiveProvider('bitbucket')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${activeProvider === 'bitbucket' ? 'bg-white/10 border-blue-500 text-white' : 'bg-[#0f1117] border-gray-800 text-gray-500 hover:text-gray-300'}`}>Bitbucket</button>
            </div>

            <p className="text-sm text-gray-400 mb-6">Enter the repository name to pull its code into this neural node. This will replace any existing context.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Repository</label>
                <input 
                  autoFocus
                  value={repoName} 
                  onChange={(e) => setRepoName(e.target.value)} 
                  placeholder="e.g., owner/repo"
                  className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder:text-gray-700"
                />
              </div>
              
              <button 
                onClick={handleSyncTrigger} 
                disabled={isSyncing || !repoName.trim()}
                className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${isSyncing || !repoName.trim() ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
              >
                {isSyncing ? <><Loader2 size={16} className="animate-spin"/> Syncing...</> : <><Zap size={16}/> Pull Files</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM CUSTOM CONFIRMATION MODAL */}
      {nodeToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="bg-[#0e1117] border border-red-900/30 w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl scale-in-95">
            <div className="p-6 md:p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Decommission Node?</h2>
              <p className="text-sm text-gray-400 mb-1">
                You are about to permanently delete <strong className="text-gray-200">"{nodeToDelete.name}"</strong>.
              </p>
              <p className="text-sm text-gray-400">
                This will destroy all synced memory files associated with it. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-6 md:px-8 pb-6 md:pb-8">
              <button 
                onClick={() => setNodeToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#161b22] hover:bg-gray-800 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDecommission}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
