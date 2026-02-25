'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Github, Gitlab, GitBranch, Zap, X, Loader2, UserCheck, ShieldAlert } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectVault() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Check for active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Update UI if user logs in or out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    fetchProjects()
    return () => subscription.unsubscribe()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('*')
      if (error) throw error
      setProjects(data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* SESSION MONITOR */}
      <div className="mb-10 p-4 rounded-2xl bg-[#111319] border border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <UserCheck className="text-blue-500" size={18} />
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">
                Protocol Active: {session.user.email}
              </span>
            </>
          ) : (
            <>
              <ShieldAlert className="text-gray-600" size={18} />
              <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">
                No Active Protocol
              </span>
            </>
          )}
        </div>
        {session && (
          <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-bold text-gray-400 hover:text-white uppercase">
            Disconnect
          </button>
        )}
      </div>

      <header className="mb-12">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Project Vault</h1>
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Nodes Active: {projects.length}</p>
      </header>

      {loading ? (
        <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="bg-[#111319] border border-gray-800 rounded-[2.5rem] p-8">
              <h2 className="text-2xl font-black italic uppercase mb-10 text-white">{p.name}</h2>
              <div className="flex gap-4">
                <button className="flex-[3] border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase text-white">Enter Node</button>
                <button onClick={() => setSelectedNode(p)} className="flex-1 bg-blue-600 flex items-center justify-center rounded-xl">
                  <Zap size={20} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-[#0f1116] border border-gray-800 rounded-[3rem] p-10 w-full max-w-sm relative">
            <button onClick={() => setSelectedNode(null)} className="absolute top-6 right-6 text-gray-500"><X size={24} /></button>
            <h3 className="text-2xl font-black italic uppercase mb-8 text-white">Source</h3>
            <div className="space-y-4">
              <button onClick={() => handleOAuth('github')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px]">
                GITHUB PROTOCOL <Zap size={14} className="text-gray-600" />
              </button>
              <button onClick={() => handleOAuth('gitlab')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px]">
                GITLAB PROTOCOL <Zap size={14} className="text-gray-600" />
              </button>
              <button onClick={() => handleOAuth('bitbucket')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px]">
                BITBUCKET PROTOCOL <Zap size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
