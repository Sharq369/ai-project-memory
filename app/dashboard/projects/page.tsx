'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Star, Zap, Search, Loader2, X, Github, Gitlab, Triangle } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ProjectVault() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewNodeOpen, setIsNewNodeOpen] = useState(false)
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      if (data) setProjects(data)
      setLoading(false)
    }
    fetchProjects()
  }, [])

  const handleCreateNode = async () => {
    if (!newNodeName) return
    const { data, error } = await supabase.from('projects').insert([{ name: newNodeName, preferred_platform: 'Vercel' }]).select()
    if (!error) {
      setProjects([data[0], ...projects])
      setNewNodeName(''); setIsNewNodeOpen(false)
    }
  }

  if (loading) return <div className="h-screen bg-[#0a0b0e] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-7xl mx-auto p-12 min-h-screen bg-[#0a0b0e] text-white">
      <header className="mb-16 flex justify-between items-end">
        <div>
          <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-none">PROJECT VAULT</h1>
          <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] mt-4">NEURAL NODES ACTIVE: {projects.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsNewNodeOpen(true)} className="bg-blue-600 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">New Node</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] p-10 hover:border-blue-600/40 transition-all group">
            <div className="flex justify-between items-start mb-10">
              <h3 className="text-2xl font-black italic uppercase truncate pr-4">{project.name}</h3>
              <Star size={14} className="text-gray-800 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-1 bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Enter Node</button>
              <button onClick={() => setIsSourceOpen(true)} className="bg-blue-600 p-4 rounded-xl hover:scale-105 transition-all">
                <Zap size={18} fill="white" stroke="none" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SOURCE SELECTION MODAL */}
      {isSourceOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative">
            <button onClick={() => setIsSourceOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white"><X size={18}/></button>
            <h2 className="text-xl font-black italic uppercase mb-8 tracking-tight">SOURCE PROTOCOL</h2>
            <div className="space-y-3">
              {['GITHUB', 'GITLAB', 'BITBUCKET'].map((protocol) => (
                <button key={protocol} onClick={() => setIsSourceOpen(false)} className="w-full bg-black/40 border border-gray-800/60 p-5 rounded-2xl flex justify-between items-center group hover:border-blue-600 transition-all">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white">{protocol}</span>
                  <Zap size={12} className="text-gray-700 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
