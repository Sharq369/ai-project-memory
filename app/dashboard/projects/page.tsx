'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Github, 
  Gitlab, 
  GitBranch, 
  Zap, 
  X, 
  Loader2, 
  UserCheck, 
  ShieldAlert,
  Plus,
  Layers
} from 'lucide-react'

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
    // 1. Initial Session Check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    checkSession()

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
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // FORCED CONSENT: Fixes the redirect loop issue
          }
        }
      })
      if (error) throw error
    } catch (err: any) {
      alert(`Connection Error: ${err.message}`)
    }
  }

  return (
    <div className="relative max-w-7xl mx-auto p-4 md:p-10 min-h-screen">
      
      {/* SESSION MONITOR BAR */}
      <div className="flex justify-between items-center mb-12 bg-[#111319] p-5 rounded-[2rem] border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                <UserCheck className="text-blue-500" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 leading-none">Protocol Active</span>
                <span className="text-gray-500 text-[9px] mt-1 font-bold">{session.user.email}</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-500/10 p-2.5 rounded-xl border border-gray-800">
                <ShieldAlert className="text-gray-500" size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No Active Session</span>
            </>
          )}
        </div>
        {session && (
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="text-[9px] font-black text-gray-600 hover:text-red-500 uppercase tracking-widest transition-all"
          >
            Terminate Session
          </button>
        )}
      </div>

      <header className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 text-white leading-none">
              Project Vault
            </h1>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-600/5 border border-blue-500/20 rounded-full">
              <Layers size={12} className="text-blue-500" />
              <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.4em]">Active Nodes: {projects.length}</p>
            </div>
          </div>
          <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-xl">
             <Plus size={18} strokeWidth={3} />
             New Node
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <Loader2 className="animate-spin text-blue-500" size={48} strokeWidth={1} />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">Syncing Vault...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[3rem] p-10 relative shadow-2xl hover:border-blue-500/40 transition-all group overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap size={120} />
              </div>
              
              <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tighter text-white group-hover:text-blue-400 transition-colors">
                {project.name}
              </h2>
              <p className="text-[10px] text-gray-600 font-bold uppercase mb-12 tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Encrypted Node
              </p>
              
              <div className="flex gap-4">
                {/* NAVIGATION TO DOCUMENTATION NODE */}
                <button 
                  onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)}
                  className="flex-[3] bg-transparent border border-gray-800 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 active:scale-95 transition-all"
                >
                  Enter Node
                </button>
                {/* SOURCE CONNECTION MODAL */}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedNode(null)} />
          <div className="relative bg-[#0f1116] border border-gray-800 rounded-[3.5rem] p-12 w-full max-w-md shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedNode(null)} 
              className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>
            
            <h3 className="text-3xl font-black italic uppercase mb-10 text-white tracking-tighter leading-none">Select Protocol</h3>
            
            <div className="space-y-5">
              <button 
                onClick={() => handleOAuth('github')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 text-white font-bold text-[11px] tracking-widest hover:border-blue-600 hover:bg-blue-600/5 transition-all"
              >
                <div className="flex items-center gap-5"><Github size={24}/> GITHUB AUTH</div>
                <Zap size={16} className="text-gray-700" />
              </button>
              
              <button 
                onClick={() => handleOAuth('gitlab')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 text-white font-bold text-[11px] tracking-widest hover:border-orange-600 hover:bg-orange-600/5 transition-all"
              >
                <div className="flex items-center gap-5"><Gitlab size={24}/> GITLAB AUTH</div>
                <Zap size={16} className="text-gray-700" />
              </button>

              <button 
                onClick={() => handleOAuth('bitbucket')} 
                className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 text-white font-bold text-[11px] tracking-widest hover:border-cyan-600 hover:bg-cyan-600/5 transition-all"
              >
                <div className="flex items-center gap-5"><GitBranch size={24}/> BITBUCKET AUTH</div>
                <Zap size={16} className="text-gray-700" />
              </button>
            </div>
            
            <p className="mt-8 text-center text-[8px] font-black uppercase tracking-[0.3em] text-gray-700"> Grounded OAuth 2.0 Security </p>
          </div>
        </div>
      )}
    </div>
  )
}
