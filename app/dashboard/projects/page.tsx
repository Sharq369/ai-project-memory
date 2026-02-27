'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Plus, Layers, Star, Activity, Search, Zap, Pencil } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const CATEGORIES = ['All', 'Frontend', 'Backend', 'Fullstack', 'API', 'Other']

export default function ProjectVault() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => (activeCategory === 'All' || p.category === activeCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0))
  }, [projects, searchTerm, activeCategory])

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-screen bg-[#0a0b0e] text-white">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">Project Vault</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Neural Nodes Active: {projects.length}</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" placeholder="Search Nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#111319] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold uppercase outline-none focus:border-blue-500 w-full"
          />
          <button className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">New Node</button>
        </div>
      </header>

      <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-blue-600 border-blue-500' : 'bg-[#111319] border-gray-800 text-gray-500'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-[#111319] border border-gray-800 rounded-[2.5rem] p-8 hover:border-blue-500/50 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black italic uppercase truncate">{project.name}</h3>
              <Star size={16} className={project.is_favorite ? "text-amber-500 fill-amber-500" : "text-gray-800"} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-1 bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5">Enter Node</button>
              <div className="bg-blue-600 p-4 rounded-xl group-hover:scale-110 transition-transform"><Zap size={18} fill="white" stroke="none" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
