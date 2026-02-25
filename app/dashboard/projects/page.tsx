'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Github, Gitlab, GitBranch, Zap, X, Loader2 } from 'lucide-react'

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
          // This ensures the user comes back to your site after login
          redirectTo: `${window.location.origin}/auth/callback` 
        }
      })
      if (error) alert(`Auth Error: ${error.message}`)
    } catch (err) {
      alert("Check your Supabase Dashboard: Is this provider enabled?")
    }
  }

  return (
    <div className="relative">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 text-white">Project Vault</h1>
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
                <button 
                  onClick={() => alert("Creating this page next!")}
                  className="flex-[3] bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-white active:bg-white/5"
                >
                  Enter Node
                </button>
                <button 
                  onClick={() => setSelectedNode(project)}
                  className="flex-1 bg-blue-600 flex items-center justify-center rounded-xl active:bg-blue-400"
                >
                  <Zap size={20} fill="white" stroke="none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0f1116] border border-gray-800 rounded-[3rem] p-10 w-full max-w-sm relative shadow-2xl">
            <button onClick={() => setSelectedNode(null)} className="absolute top-6 right-6 text-gray-500"><X size={24} /></button>
            <h3 className="text-2xl font-black italic uppercase mb-8 text-white">Source</h3>
            
            <div className="space-y-4">
              <button onClick={() => handleOAuth('github')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-blue-500">
                <div className="flex items-center gap-4"><Github size={20}/> GITHUB</div>
                <Zap size={14} className="text-gray-600" />
              </button>
              <button onClick={() => handleOAuth('gitlab')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-orange-500">
                <div className="flex items-center gap-4"><Gitlab size={20}/> GITLAB</div>
                <Zap size={14} className="text-gray-600" />
              </button>
              <button onClick={() => handleOAuth('bitbucket')} className="w-full flex items-center justify-between bg-[#16181e] p-6 rounded-2xl border border-gray-800 text-white font-bold text-[10px] tracking-widest active:border-cyan-500">
                <div className="flex items-center gap-4"><GitBranch size={20}/> BITBUCKET</div>
                <Zap size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
