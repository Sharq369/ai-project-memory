'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Star, Zap, Search, Loader2, X, Github, Gitlab, Globe } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const CATEGORIES = ['ALL', 'FRONTEND', 'BACKEND', 'FULLSTACK', 'API', 'OTHER']

export default function ProjectVault() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  const handleCreateNode = async () => {
    if (!newNodeName) return
    const { data, error } = await supabase.from('projects').insert([
      { name: newNodeName, category: 'OTHER', preferred_platform: 'Vercel' }
    ]).select()
    
    if (!error && data) {
      setProjects([data[0], ...projects])
      setNewNodeName('')
      setIsModalOpen(false)
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      (activeCategory === 'ALL' || (p.category && p.category.toUpperCase() === activeCategory)) && 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [projects, searchTerm, activeCategory])

  if (loading) return <div className="h-screen bg-[#0a0b0e] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-screen bg-[#0a0b0e] text-white font-sans">
      
      {/* HEADER MATCHING YOUR SCREENSHOT */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">PROJECT VAULT</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3">NEURAL NODES ACTIVE: {projects.length}</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto items-center">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" placeholder="SEARCH NODES..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111319] border border-gray-800/60 rounded-xl pl-10 pr-6 py-3 text-[10px] font-bold uppercase outline-none focus:border-blue-500 w-full md:w-64 transition-all"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">NEW NODE</button>
        </div>
      </header>

      {/* FILTER PILLS MATCHING YOUR SCREENSHOT */}
      <div className="flex gap-2 mb-12 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-[#111319] text-gray-500 hover:text-gray-300'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* PROJECT CARDS MATCHING YOUR SCREENSHOT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-3xl p-8 flex flex-col justify-between min-h-[160px] hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black italic uppercase truncate pr-4">{project.name}</h3>
              <Star size={14} className={project.is_favorite ? "text-amber-500 fill-amber-500" : "text-gray-700"} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-1 bg-transparent border border-gray-800 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">ENTER NODE</button>
              <button onClick={(e) => { e.stopPropagation(); alert("Neural Sync Triggered. Awaiting GitHub Webhook...") }} className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center aspect-square">
                <Zap size={16} fill="white" stroke="none" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NEW NODE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-2xl font-black italic uppercase mb-6">INITIALIZE NODE</h2>
            <input 
              autoFocus value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="NODE NAME..."
              className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 mb-6 text-white text-sm font-bold outline-none focus:border-blue-500"
            />
            <button onClick={handleCreateNode} className="w-full bg-blue-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all">CREATE NODE</button>
          </div>
        </div>
      )}
    </div>
  )
}
