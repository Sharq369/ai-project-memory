'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Github, Gitlab, GitBranch, Zap, X, Loader2, UserCheck, ShieldAlert } from 'lucide-react'

// Initialize Supabase Client
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
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 2. Listen for Auth Changes (Login/Logout)
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
          // Redirects to your callback handler
          redirectTo: `${window.location.origin}/auth/callback` 
        }
      })
      if (error) throw error
    } catch (err: any) {
      alert(`Connection Error: ${err.message}`)
    }
  }

  return (
    <div className="relative max-w-7xl mx-auto p-4 md:p-8">
      {/* SESSION MONITOR BAR */}
      <div className="flex justify-between items-center mb-8 bg-[#111319] p-4 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="bg-blue-500/10 p-2 rounded-full">
                <UserCheck className="text-blue-500" size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                Protocol Active: {session.user.email}
              </span>
            </>
          ) : (
            <>
              <div className="bg-gray-500/10 p-2 rounded-full">
                <ShieldAlert className="text-gray-500" size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                No Active Session
              </span>
            </>
          )}
        </div>
        {session && (
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="text-[9px] font-bold text-gray-500 hover:text-white uppercase tracking-tighter transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      <header className="mb-12">
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-2 text-white">Project Vault</h1>
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Nodes Active: {projects.length}</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] p-8 relative shadow-xl hover:border-blue-500/30 transition-all group">
              <h2 className="text-2xl font-black italic uppercase mb-1 tracking-tighter text-white group-hover:text-blue-400 transition-colors">
                {project.name}
              </h2>
              <p className="text-[9px] text-blue-500 font-bold uppercase mb-8">Active Node</p>
              
              <div className="flex gap-4 mt-4">
                {/* NAVIGATION BUTTON */}
                <button 
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="flex-[3] bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/5 active:scale-95 transition-all"
                >
                  Enter Node
                </button>
                {/* CONNECT MODAL BUTTON */}
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-blue-600 flex items-center justify-center rounded-xl hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-900/40 transition-all"
                >
                  <Zap size={20} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONNECT SOURCE MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0f1116] border border-gray-800 rounded-[3rem] p-10 w-full max-w-sm relative shadow-2xl">
            <button 
              onClick={() => setSelectedNode(null)} 
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-2xl font-black italic uppercase mb-8 text-white tracking-tighter">Connect Source</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleOAuth('github')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest hover:border-blue-500 transition-all"
              >
                <div className="flex items-center gap-4"><Github size={20}/> GITHUB PROTOCOL</div>
                <Zap size={14} className="text-gray-600" />
              </button>
              
              <button 
                onClick={() => handleOAuth('gitlab')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest hover:border-orange-500 transition-all"
              >
                <div className="flex items-center gap-4"><Gitlab size={20}/> GITLAB PROTOCOL</div>
                <Zap size={14} className="text-gray-600" />
              </button>

              <button 
                onClick={() => handleOAuth('bitbucket')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest hover:border-cyan-500 transition-all"
              >
                <div className="flex items-center gap-4"><GitBranch size={20}/> BITBUCKET PROTOCOL</div>
                <Zap size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
