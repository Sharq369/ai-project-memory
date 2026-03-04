'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, FolderGit2, Trash2, ArrowRight, Loader2, X, AlertTriangle } from 'lucide-react'

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

  const fetchProjects = async () => {
    // Fetch projects AND their associated memories to determine Active/Grounded state
    const { data, error } = await supabase
      .from('projects')
      .select('*, code_memories(id)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProjects(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async () => {
    setCreating(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: 'New Neural Node' })
      .select()
      .single()

    if (!error && data) {
      router.push(`/dashboard/projects/${data.id}/doc`)
    } else {
      setCreating(false)
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
    }
    
    setIsDeleting(false)
    setNodeToDelete(null)
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
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
              // Determine status based on the joined code_memories array
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
                    
                    {/* CUSTOM PREMIUM DELETE BUTTON */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setNodeToDelete({ id: project.id, name: project.name })
                      }}
                      className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2 truncate pr-4">{project.name}</h3>
                  
                  {/* DYNAMIC STATUS TAGS */}
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
