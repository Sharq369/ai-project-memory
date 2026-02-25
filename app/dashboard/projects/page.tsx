'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Github, Gitlab, GitBranch, Zap, X, Loader2, UserCheck, ShieldAlert } from 'lucide-react'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectVault() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Check session status immediately
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    
    checkSession()

    // Listen for real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    fetchProjects()

    return () => subscription.unsubscribe()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('projects').select('*')
      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // This forces GitHub/GitLab to show the auth screen every time
          }
        }
      })
      if (error) throw error
    } catch (err: any) {
      alert(`Auth Error: ${err.message}`)
    }
  }

  return (
    <div className="relative max-w-7xl mx-auto p-4 md:p-10">
      {/* AUTH STATUS MONITOR */}
      <div className="flex justify-between items-center mb-10 bg-[#111319] p-5 rounded-[2rem] border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                <UserCheck className="text-blue-500" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 leading-none">Protocol Active</span>
                <span className="text-gray-400 text-[9px] mt-1">{session.user.email}</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-yellow-500/10 p-2 rounded-xl border border-yellow-500/20">
                <ShieldAlert className="text-yellow-500" size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">No Active Protocol</span>
            </>
          )}
        </div>
        {session && (
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="text-[9px] font-black text-gray-500 hover:text-red-500 uppercase tracking-tighter transition-all"
          >
            Terminate Session
          </button>
        )}
      </div>

      <header className="mb-12">
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-white leading-none">Project Vault</h1>
        <div className="inline-block px-4 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full">
           <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em]">Total Nodes: {projects.length}</p>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Synchronizing...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[3rem] p-10 relative shadow-2xl hover:border-blue-500/40 transition-all group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tighter text-white group-hover:text-blue-400 transition-colors">
                {project.name}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-12">Encrypted Node</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="flex-[3] bg-transparent border border-gray-800 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 active:scale-95 transition-all"
                >
                  Enter Node
                </button>
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-blue-600 flex items-center justify-center rounded-2xl hover:bg-blue-500 active:scale-95 shadow-xl shadow-blue-900/30 transition-all"
                >
                  <Zap size={22} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONNECT SOURCE MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="bg-[#0f1116] border border-gray-800 rounded-[3.5rem] p-12 w-full max-w-md relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => setSelectedNode(null)} 
              className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors p-2"
            >
              <X size={28} />
            </button>
            
            <h3 className="text-3xl font-black italic uppercase mb-10 text-white tracking-tighter leading-none">Select Protocol</h3>
            
            <div className="space-y-5">
              <button 
                onClick={() => handleOAuth('github')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 text-white font-bold text-[11px] tracking-widest hover:border-blue-600 active:bg-blue-600/5 transition-all"
              >
                <div className="flex items-center gap-5"><Github size={24}/> GITHUB AUTH</div>
                <Zap size={16} className="text-gray-700" />
              </button>
              
              <button 
                onClick={() => handleOAuth('gitlab')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 text-white font-bold text-[11px] tracking-widest hover:border-orange-600 active:bg-orange-600/5 transition-all"
              >
                <div className="flex items-center gap-5"><Gitlab size={24}/> GITLAB AUTH</div>
                <Zap size={16} className="text-gray-700" />
              </button>

              <button 
                onClick={() => handleOAuth('bitbucket')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 text-white font-bold text-[11px] tracking-widest hover:border-cyan-600 active:bg-cyan-600/5 transition-all"
              >
                <div className="flex items-center gap-5"><GitBranch size={24}/> BITBUCKET AUTH</div>
                <Zap size={16} className="text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
