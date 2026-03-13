'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Plus, FolderGit2, Trash2, ArrowRight, Loader2, 
  AlertTriangle, Activity, RefreshCw, Github, Gitlab, 
  Cloud, Zap, X, CheckCircle2, AlertCircle, Info, Database
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
  
  const [nodeToDelete, setNodeToDelete] = useState<{ id: string, name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notification, setNotification] = useState<{ visible: boolean, type: 'success' | 'error' | 'info', message: string }>({ visible: false, type: 'info', message: '' })
  
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null)
  const [repoName, setRepoName] = useState('')
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')
  const [isSyncing, setIsSyncing] = useState(false)

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ visible: true, type, message })
    setTimeout(() => setNotification({ visible: false, type: 'info', message: '' }), 5000)
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

  useEffect(() => {
    loadNodes()
  }, [])

  const loadNodes = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (!user || authError) {
        window.location.href = '/login'
        return
      }

      const { data: projData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (projData) {
        const { data: memData } = await supabase.from('code_memories').select('id, project_id')
        
        const mergedProjects = projData.map(project => ({
          ...project,
          fileCount: memData ? memData.filter(m => m.project_id === project.id).length : 0
        }))
        setProjects(mergedProjects)
      } else {
        setProjects([])
      }
      
    } catch (err: any) {
      console.error("Vault Load Error:", err)
      showToast('error', 'Failed to initialize vault data.')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    setCreating(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      const userId = user?.id

      if (!userId || authError) {
        showToast('error', 'Session disconnected. Please log in again.')
        setCreating(false)
        window.location.href = '/login'
        return
      }

      const check = await fetch('/api/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'create_project' })
      })

      if (!check.ok) throw new Error('Failed to reach Node limits API.')
      const result = await check.json()

      if (!result.allowed) {
        showToast('error', result.reason)
        setCreating(false)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({ name: 'New Neural Node', user_id: userId })
        .select()
        .single()

      if (error) {
        showToast('error', `Security Blocked: ${error.message}`)
        setCreating(false)
      } else if (data) {
        router.push(`/dashboard/projects/${data.id}/doc`)
      }
    } catch (err: any) {
      console.error("Vault Creation Error:", err)
      showToast('error', err.message || 'An unexpected error occurred.')
      setCreating(false)
    }
  }

  const confirmDecommission = async () => {
    if (!nodeToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('projects').delete().eq('id', nodeToDelete.id)
      if (error) throw error
      setProjects(projects.filter(p => p.id !== nodeToDelete.id))
      showToast('success', `Node "${nodeToDelete.name}" successfully decommissioned.`)
      setNodeToDelete(null)
    } catch (err: any) {
      showToast('error', `Decommissioning failed: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSyncTrigger = async () => {
    if (!repoName.trim() || !syncingProjectId) return
    setIsSyncing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      if (!userId) {
        showToast('error', 'Authentication error.')
        setIsSyncing(false)
        return
      }

      await supabase.from('code_memories').delete().eq('project_id', syncingProjectId)

      const response = await fetch(`/api/sync/${activeProvider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoName, projectId: syncingProjectId, userId })
      })

      const result = await response.json()

      if (result.upgrade) {
        showToast('error', result.error)
      } else if (result.success) {
        if (result.capped) {
          showToast('info', `Only ${result.limit} files pulled — upgrade plan to sync more.`)
        } else if (result.count === 0) {
          showToast('info', 'Sync complete but 0 files pulled. Check repo name.')
        } else {
          showToast('success', `${result.count} files synced to node.`)
        }
        await loadNodes()
        setIsSyncModalOpen(false)
        setRepoName('')
      } else {
        showToast('error', `Sync Error: ${result.error}`)
      }
    } catch (err) {
      showToast('error', 'Network Error: Could not reach sync API.')
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] bg-[#050505]">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
          <Activity className="text-blue-500 animate-pulse relative z-10" size={48} />
        </div>
        <p className="mt-6 text-gray-400 text-sm tracking-widest uppercase font-semibold animate-pulse">
          Initializing Neural Vault...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto max-h-screen bg-[#050505] custom-scrollbar relative">
      
      {/* Toast Notification */}
      <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${notification.visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-95 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' :
          notification.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-300' :
          'bg-blue-950/80 border-blue-500/30 text-blue-300'
        }`}>
          {notification.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
          {notification.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
          {notification.type === 'info' && <Info size={18} className="text-blue-500" />}
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification({ ...notification, visible: false })} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-8 lg:p-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-[#111111] border border-gray-800 rounded-xl shadow-lg shadow-black">
                <FolderGit2 className="text-blue-500" size={24} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Project Vault</h1>
            </div>
            <p className="text-gray-500 text-sm md:text-base pl-1">
              Manage your active neural nodes and codebase memory arrays.
            </p>
          </div>
          
          <button
            onClick={handleCreateProject}
            disabled={creating}
            className="group relative flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {creating ? <Loader2 className="animate-spin text-black" size={20} /> : <Plus size={20} className="transition-transform group-hover:rotate-90" />}
            <span>Initialize New Node</span>
          </button>
        </div>

        {/* Heat Map */}
        <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative group shadow-xl">
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
                <div key={i} className={`w-3 h-3 rounded-[2px] transition-colors duration-300 hover:ring-1 hover:ring-white/50 cursor-crosshair ${level === 0 ? 'bg-gray-800/40' : level === 1 ? 'bg-blue-900/60' : level === 2 ? 'bg-blue-600/80' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'}`} title={`Activity level: ${level}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl bg-[#0a0a0a] backdrop-blur-sm">
              <Cloud className="text-gray-700 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Vault Empty</h3>
              <p className="text-gray-500 text-center max-w-sm mb-6 text-sm">
                Initialize your first neural node to start syncing code repositories for AI context.
              </p>
              <button onClick={handleCreateProject} disabled={creating} className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">
                Create your first project <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            projects?.map((project) => {
              const fileCount = project.fileCount || 0
              const isGrounded = fileCount === 0
              
              // Simulated Completion Logic for the UI
              // Creates a stable but dynamic percentage based on file counts
              const codebaseMaturity = isGrounded ? 0 : Math.min(Math.max(Math.round((fileCount * 2.8) + (project.name.length * 1.5)), 12), 100);

              return (
                <div 
                  key={project.id}
                  className={`group relative bg-[#0a0a0a]/90 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.08)] flex flex-col cursor-pointer h-full overflow-hidden ${
                    isGrounded ? 'border-gray-800 hover:border-gray-600' : 'border-blue-900/30 hover:border-blue-500/50'
                  }`}
                  onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)}
                >
                  {/* --- PREMIUM ACCENT STRIPE --- */}
                  <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r transition-all duration-500 ${
                    isGrounded ? 'from-transparent via-gray-600 to-transparent opacity-20 group-hover:opacity-50' : 'from-transparent via-blue-500 to-transparent opacity-70 group-hover:opacity-100 group-hover:shadow-[0_0_15px_rgba(59,130,246,1)]'
                  }`} />
                  
                  {/* Subtle inner radial gradient */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent pointer-events-none" />

                  <div className="relative z-10 flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#111] border border-gray-800/80 rounded-xl group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-colors">
                        <FolderGit2 className="text-blue-500" size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors line-clamp-1 pr-2">
                        {project.name}
                      </h3>
                    </div>
                    
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 transition-colors ${
                      isGrounded ? 'bg-gray-900/50 text-gray-400 border-gray-800' : 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isGrounded ? 'bg-gray-500' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]'}`}></div>
                      {isGrounded ? 'Grounded' : 'Active'}
                    </span>
                  </div>

                  {/* Meta Data (ID & Files) */}
                  <div className="relative z-10 flex flex-wrap items-center gap-2 mb-5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111] border border-gray-800/80 rounded-md">
                      <Database size={12} className="text-gray-500" />
                      <span className="text-[10px] font-mono text-gray-400">ID: {project.id.split('-')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111] border border-gray-800/80 rounded-md">
                      <Activity size={12} className={isGrounded ? "text-gray-500" : "text-blue-400"} />
                      <span className="text-[10px] font-mono text-gray-400">
                        {fileCount} {fileCount === 1 ? 'File' : 'Files'}
                      </span>
                    </div>
                  </div>

                  {/* --- NEW: CODEBASE MATURITY PROGRESS BAR --- */}
                  <div className="relative z-10 mb-6 group/progress">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider group-hover/progress:text-gray-400 transition-colors">Codebase Maturity</span>
                      <span className={`text-[10px] font-mono font-bold ${isGrounded ? 'text-gray-600' : 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]'}`}>{codebaseMaturity}%</span>
                    </div>
                    <div className="w-full bg-[#161b22] rounded-full h-1.5 overflow-hidden border border-gray-800 shadow-inner">
                      <div 
                        className={`h-1.5 rounded-full relative transition-all duration-1000 ease-out ${isGrounded ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} 
                        style={{ width: `${codebaseMaturity}%` }}
                      >
                        {!isGrounded && <div className="absolute top-0 right-0 bottom-0 w-3 bg-white/40 blur-[2px] animate-[shimmer_2s_infinite]"></div>}
                      </div>
                    </div>
                  </div>

                  {/* Action Icons */}
                  <div className="relative z-10 flex items-center gap-2 mb-5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSyncingProjectId(project.id); setIsSyncModalOpen(true); }}
                      className="p-2 bg-[#111] border border-gray-800 rounded-lg text-gray-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all"
                      title="Sync Repository"
                    ><RefreshCw size={14} /></button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setNodeToDelete({ id: project.id, name: project.name }); }}
                      className="p-2 bg-[#111] border border-gray-800 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                      title="Decommission Node"
                    ><Trash2 size={14} /></button>
                  </div>

                  {/* Bottom Row */}
                  <div className="relative z-10 mt-auto pt-4 flex items-center justify-between border-t border-gray-800/50">
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
                      {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 group-hover:text-blue-400 transition-colors">
                      Enter Node <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {nodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isDeleting && setNodeToDelete(null)} />
          <div className="relative bg-[#0d1117] border border-red-900/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
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
              <button onClick={() => setNodeToDelete(null)} disabled={isDeleting} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#161b22] hover:bg-gray-800 text-gray-300 transition-colors">Cancel</button>
              <button onClick={confirmDecommission} disabled={isDeleting} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-colors flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSyncing && setIsSyncModalOpen(false)} />
          <div className="relative bg-[#0d1117] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><RefreshCw size={20} /></div>
                <h2 className="text-xl font-bold text-white">Initialize Sync Pipeline</h2>
              </div>
              <button onClick={() => setIsSyncModalOpen(false)} disabled={isSyncing} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-gray-400 mb-6">Connect a remote repository to inject its codebase into this node's memory banks.</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'github', icon: Github, label: 'GitHub', activeColor: 'border-white text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.15)]' },
                  { id: 'gitlab', icon: Gitlab, label: 'GitLab', activeColor: 'border-orange-500 text-orange-400 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]' },
                  { id: 'bitbucket', icon: Cloud, label: 'Bitbucket', activeColor: 'border-blue-500 text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' }
                ].map((provider) => (
                  <button key={provider.id} onClick={() => setActiveProvider(provider.id as any)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${activeProvider === provider.id ? provider.activeColor : 'bg-[#161b22] border-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
                    <provider.icon size={24} />
                    <span className="text-xs font-semibold tracking-wider uppercase">{provider.label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Repository Target</label>
                <div className="relative">
                  <input type="text" value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="e.g. facebook/react" className="w-full bg-[#111] border border-gray-700 rounded-xl py-3 pl-4 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm" />
                  <Zap className="absolute right-3 top-3.5 text-gray-500" size={16} />
                </div>
                <p className="text-[11px] text-gray-500 font-mono mt-1">Format: username/repository</p>
              </div>
            </div>
            <div className="p-6 bg-black/20 border-t border-gray-800/50 mt-auto">
              <button onClick={handleSyncTrigger} disabled={isSyncing || !repoName.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isSyncing ? <><Loader2 size={18} className="animate-spin text-black" /><span>Establishing Connection...</span></> : <><RefreshCw size={18} /><span>Confirm Sync</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
