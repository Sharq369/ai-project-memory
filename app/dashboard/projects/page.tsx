'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Github, Gitlab, GitBranch, Globe, Zap, X, Loader2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectVault() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<any>(null)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*')
    setProjects(data || [])
    setLoading(false)
  }

  // Handle OAuth Sign-in
  const handleOAuth = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="relative">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Project Vault</h1>
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Nodes Active: {projects.length}</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] p-8 relative shadow-xl">
              <h2 className="text-2xl font-black italic uppercase mb-1 tracking-tighter text-white">{project.name}</h2>
              <div className="flex gap-4 mt-10">
                {/* ENTER BUTTON NOW FUNCTIONAL */}
                <button 
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="flex-[3] bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest active:bg-white/5 transition-all text-white"
                >
                  Enter Node
                </button>
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-blue-600 flex items-center justify-center rounded-xl active:bg-blue-400 shadow-lg shadow-blue-900/20"
                >
                  <Zap size={20} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: REAL AUTH LOGIC */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0f1116] border border-gray-800 rounded-[3rem] p-10 w-full max-w-sm relative">
            <button onClick={() => setSelectedNode(null)} className="absolute top-6 right-6 text-gray-500"><X size={24} /></button>
            <h3 className="text-2xl font-black italic uppercase mb-8 text-white">Connect Source</h3>
            
            <div className="space-y-4">
              <button onClick={() => handleOAuth('github')} className="w-full flex items-center gap-4 bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-blue-500">
                <Github size={20}/> GITHUB PROTOCOL
              </button>
              <button onClick={() => handleOAuth('gitlab')} className="w-full flex items-center gap-4 bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-orange-500">
                <Gitlab size={20}/> GITLAB PROTOCOL
              </button>
              <button onClick={() => handleOAuth('bitbucket')} className="w-full flex items-center gap-4 bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-cyan-500">
                <GitBranch size={20}/> BITBUCKET PROTOCOL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
