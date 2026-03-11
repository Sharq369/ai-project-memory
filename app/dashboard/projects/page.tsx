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

  // Premium UI States for Notifications
  const [notification, setNotification] = useState<{ visible: boolean, type: 'success' | 'error' | 'info', message: string }>({ visible: false, type: 'info', message: '' })
  
  // Sync Engine State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null)
  const [repoName, setRepoName] = useState('')
  const [activeProvider, setActiveProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')
  const [isSyncing, setIsSyncing] = useState(false)

  // Custom Toast Function
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ visible: true, type, message })
    setTimeout(() => setNotification({ visible: false, type: 'info', message: '' }), 5000)
  }

  useEffect(() => {
    loadNodes()
  }, [])

  const loadNodes = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (!user || authError) {
        router.push('/auth')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      console.error("Vault Load Error:", err)
      showToast('error', 'Failed to initialize vault data.')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  // --- CRASH PROOF CREATE FUNCTION ---
  const handleCreateProject = async () => {
    setCreating(true)

    try {
      // 1. Get user securely
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      const userId = user?.id

      if (!userId || authError) {
        showToast('error', 'Auth sync failed. Please log in again.')
        setCreating(false)
        return
      }

      // 2. Check Plan Limits
      const check = await fetch('/api/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'create_project' })
      })

      if (!check.ok) {
        throw new Error('Failed to reach enforcement API.')
      }

      const result = await check.json()

      if (!result.allowed) {
        showToast('error', result.reason)
        setCreating(false)
        return
      }

      // 3. Create Project with explicit user_id for RLS
      const { data, error } = await supabase
        .from('projects')
        .insert({ name: 'New Neural Node', user_id: userId })
        .select()
        .single()

      if (error) {
        showToast('error', `Database Blocked: ${error.message}`)
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
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', nodeToDelete.id)
        
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

  // --- REAL SYNC PIPELINE ---
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

      // Clean old memories before fresh sync
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
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
    <div className="flex-1 overflow-y-auto max-h-screen custom-scrollbar relative">
      {/* Toast Notification */}
      <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${notification.visible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
          notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }`}>
          {notification.type === 'success' && <CheckCircle2 size={18} />}
          {notification.type === 'error' && <AlertCircle size={18} />}
          {notification.type === 'info' && <Info size={18} />}
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification({ ...notification, visible: false })} className="ml-2 hover:opacity-70 transition-opacity">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-8 lg:p-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#161b22] border border-gray-800 rounded-lg">
                <FolderGit2 className="text-blue-500" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Project Vault</h1>
            </div>
            <p className="text-gray-400 text-sm md:text-base">
              Manage your active neural nodes and codebase memory arrays.
            </p>
          </div>
          
          <button
            onClick={handleCreateProject}
            disabled={creating}
            className="group relative flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {creating ? (
              <Loader2 className="animate-spin text-black" size={20} />
            ) : (
              <Plus size={20} className="transition-transform group-hover:rotate-90" />
            )}
            <span>Initialize New Node</span>
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl bg-[#0d1117]/50 backdrop-blur-sm">
              <Cloud className="text-gray-600 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No Active Nodes</h3>
              <p className="text-gray-500 text-center max-w-sm mb-6 text-sm">
                Your vault is empty. Initialize a new node to begin syncing code memories.
              </p>
              <button
                onClick={handleCreateProject}
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#161b22] border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800 text-gray-300 rounded-lg transition-all"
              >
                <Plus size={18} />
                <span>Create First Node</span>
              </button>
            </div>
          ) : (
            projects?.map((project) => (
              <div 
                key={project.id}
                className="group relative bg-[#161b22] border border-gray-800 hover:border-gray-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 flex flex-col"
              >
                {/* Status Indicator */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="p-6 flex-1 cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-gray-900/80 rounded-xl border border-gray-800/50 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                      <FolderGit2 className="text-gray-400 group-hover:text-blue-400 transition-colors" size={20} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-100 group-hover:text-white mb-2 line-clamp-1 transition-colors">
                    {project.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                    <span className="bg-black/30 px-2 py-1 rounded border border-gray-800">
                      ID: {project.id.split('-')[0]}
                    </span>
                    <span>•</span>
                    <span>{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 bg-black/20 border-t border-gray-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSyncingProjectId(project.id);
                        setIsSyncModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                      title="Sync Pipeline"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNodeToDelete({ id: project.id, name: project.name });
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Decommission Node"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 group-hover:text-white transition-colors"
                  >
                    Enter Node <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {nodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isDeleting && setNodeToDelete(null)} />
          <div className="relative bg-[#0d1117] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full border border-red-500/20 mx-auto flex items-center justify-center mb-6">
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
            <div className="flex gap-3 px-6 pb-6">
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

      {/* Sync Pipeline Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSyncing && setIsSyncModalOpen(false)} />
          <div className="relative bg-[#0d1117] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <RefreshCw size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Initialize Sync Pipeline</h2>
              </div>
              <button 
                onClick={() => setIsSyncModalOpen(false)}
                disabled={isSyncing}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-gray-400 mb-6">
                Connect a remote repository to inject its codebase into this node's memory banks.
              </p>

              {/* Provider Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'github', icon: Github, label: 'GitHub' },
                  { id: 'gitlab', icon: Gitlab, label: 'GitLab' },
                  { id: 'bitbucket', icon: Cloud, label: 'Bitbucket' }
                ].map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setActiveProvider(provider.id as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      activeProvider === provider.id 
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                        : 'bg-[#161b22] border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <provider.icon size={24} />
                    <span className="text-xs font-semibold">{provider.label}</span>
                  </button>
                ))}
              </div>

              {/* Input Field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Repository Target</label>
                <div className="relative">
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="e.g. facebook/react"
                    className="w-full bg-[#161b22] border border-gray-700 rounded-xl py-3 pl-4 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                  />
                  <Zap className="absolute right-3 top-3.5 text-gray-500" size={16} />
                </div>
                <p className="text-[11px] text-gray-500 font-mono mt-1">Format: username/repository</p>
              </div>
            </div>

            <div className="p-6 bg-black/20 border-t border-gray-800/50 mt-auto">
              <button
                onClick={handleSyncTrigger}
                disabled={isSyncing || !repoName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Establishing Connection...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    <span>Confirm Sync</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
