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
    // 1. Check if a session exists (The "Seasons" check)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for login/logout changes
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
          // Automatically uses https://ai-project-memory.vercel.app/auth/callback
          redirectTo: `${window.location.origin}/auth/callback` 
        }
      })
      if (error) alert(`Auth Error: ${error.message}`)
    } catch (err) {
      alert("Check Supabase: Is this provider enabled with the right Keys?")
    }
  }

  return (
    <div className="relative max-w-7xl mx-auto">
      {/* SESSION STATUS HEADER */}
      <div className="flex justify-between items-center mb-8 bg-[#111319]/50 p-4 rounded-2xl border border-gray-800/50">
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="bg-green-500/10 p-2 rounded-full"><UserCheck className="text-green-500" size={18} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Session Active: {session.user.email}</span>
            </>
          ) : (
            <>
              <div className="bg-yellow-500/10 p-2 rounded-full"><ShieldAlert className="text-yellow-500" size={18} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">No Active Session</span>
            </>
          )}
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-bold text-gray-500 hover:text-white uppercase tracking-tighter">Sign Out</button>
      </div>

      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 text-white">Project Vault</h1>
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Nodes Active: {projects.length}</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] p-8 relative shadow-xl hover:border-blue-500/30 transition-all group">
              <h2 className="text-2xl font-black italic uppercase mb-1 tracking-tighter text-white group-hover:text-blue-400 transition-colors">{project.name}</h2>
              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="flex-[3] bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-white active:bg-white/5 transition-all"
                >
                  Enter Node
                </button>
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-blue-600 flex items-center justify-center rounded-xl active:bg-blue-400 shadow-lg shadow-blue-900/40"
                >
                  <Zap size={20} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CONNECT SOURCE */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0f1116] border border-gray-800 rounded-[3rem] p-10 w-full max-w-sm relative shadow-2xl">
            <button onClick={() => setSelectedNode(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>
            <h3 className="text-2xl font-black italic uppercase mb-8 text-white tracking-tighter">Connect Source</h3>
            
            <div className="space-y-4">
              <button onClick={() => handleOAuth('github')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-blue-500 transition-all">
                <div className="flex items-center gap-4"><Github size={20}/> GITHUB PROTOCOL</div>
                <Zap size={14} className="text-gray-600" />
              </button>
              
              <button onClick={() => handleOAuth('gitlab')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-orange-500 transition-all">
                <div className="flex items-center gap-4"><Gitlab size={20}/> GITLAB PROTOCOL</div>
                <Zap size={14} className="text-gray-600" />
              </button>

              <button onClick={() => handleOAuth('bitbucket')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-cyan-500 transition-all">
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
