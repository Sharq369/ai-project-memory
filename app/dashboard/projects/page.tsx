'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Plus, Star, Zap, Search, Loader2, X } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ProjectVault() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
    const { data, error } = await supabase.from('projects').insert([{ name: newNodeName, category: 'Other', preferred_platform: 'Vercel' }]).select()
    if (!error) {
      setProjects([data[0], ...projects])
      setNewNodeName(''); setIsModalOpen(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-12 min-h-screen bg-[#0a0b0e] text-white">
      <header className="mb-16 flex justify-between items-end">
        <div>
          <h1 className="text-7xl font-black italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Neural Nodes Active: {projects.length}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-xl shadow-blue-900/20">New Node</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#111319] border border-gray-800/60 rounded-[3rem] p-10 hover:border-blue-500/50 transition-all group">
            <h3 className="text-3xl font-black italic uppercase mb-8 truncate pr-6">{project.name}</h3>
            <div className="flex gap-4">
              <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-1 bg-transparent border border-gray-800 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Enter Node</button>
              <button onClick={(e) => { e.stopPropagation(); alert("Neural Sync Triggered...") }} className="bg-blue-600 p-5 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-blue-900/30">
                <Zap size={22} fill="white" stroke="none" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-md rounded-[3rem] p-12 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white"><X size={28}/></button>
            <h2 className="text-4xl font-black italic uppercase mb-10">Init Node</h2>
            <input autoFocus value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)} placeholder="Node Name..." className="w-full bg-black/40 border border-gray-800 rounded-2xl p-6 mb-8 text-white font-bold outline-none focus:border-blue-500 transition-all"/>
            <button onClick={handleCreateNode} className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Create Node</button>
          </div>
        </div>
      )}
    </div>
  )
}
