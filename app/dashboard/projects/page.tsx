'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Github, Gitlab, Zap, X, Loader2, UserCheck, ShieldAlert,
  Plus, Layers, Database, Pencil, Trash2, Search, Filter, Star, Activity, Tag, ChevronDown
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Fullstack', 'API', 'Mobile', 'Other']

export default function ProjectVault() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editNode, setEditNode] = useState<any>(null)
  const [newNodeName, setNewNodeName] = useState('')
  const [newCategory, setNewCategory] = useState('Frontend')
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    checkSession()
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => (activeCategory === 'All' || p.category === activeCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0))
  }, [projects, searchTerm, activeCategory])

  const toggleFavorite = async (id: string, state: boolean) => {
    await supabase.from('projects').update({ is_favorite: !state }).eq('id', id)
    setProjects(projects.map(p => p.id === id ? { ...p, is_favorite: !state } : p))
  }

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    const { data } = await supabase.from('projects').insert([{ name: newNodeName, category: newCategory }]).select()
    if (data) setProjects([data[0], ...projects])
    setNewNodeName(''); setIsCreateModalOpen(false); setIsProcessing(false)
  }

  return (
    <div className="relative max-w-7xl mx-auto p-4 md:p-10 min-h-screen">
      {/* HEADER SECTION */}
      <header className="mb-10">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
          <div>
            <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 text-white leading-none">Project Vault</h1>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-600/5 border border-blue-500/20 rounded-full text-blue-500">
              <Layers size={12} /><p className="text-[9px] font-black uppercase tracking-[0.4em]">Active Nodes: {projects.length}</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500" size={18} />
              <input 
                type="text" placeholder="SEARCH NODES..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111319] border border-gray-800 rounded-2xl py-5 pl-16 pr-6 text-[11px] text-white font-black uppercase tracking-widest outline-none focus:border-blue-500/50"
              />
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
               <Plus size={18} strokeWidth={3} /> New Node
            </button>
          </div>
        </div>
      </header>

      {/* CATEGORY STRIP */}
      <div className="flex items-center gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#111319] border-gray-800 text-gray-600 hover:text-white'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* PROJECT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <div key={project.id} className="group relative bg-[#111319] border border-gray-800/40 rounded-[3rem] p-10 overflow-hidden transition-all hover:border-blue-500/40">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-blue-400 truncate">{project.name}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-500/60 py-1 px-2 border border-blue-500/20 rounded-md bg-blue-500/5">{project.category || 'Standard'}</span>
                  {project.is_favorite && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 py-1 px-2 border border-amber-500/20 rounded-md bg-amber-500/5">Pinned</span>}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => toggleFavorite(project.id, project.is_favorite)} className={`p-2 transition-all ${project.is_favorite ? 'text-amber-500' : 'text-gray-700 hover:text-white'}`}><Star size={18} fill={project.is_favorite ? "currentColor" : "none"} /></button>
                <button onClick={() => { setEditNode(project); setEditName(project.name); setEditCategory(project.category); }} className="p-2 text-gray-700 hover:text-white"><Pencil size={14} /></button>
              </div>
            </div>
            
            <div className="flex gap-1 mb-10 opacity-40 group-hover:opacity-100 transition-opacity">
              {[...Array(6)].map((_, i) => (<div key={i} className={`w-3 h-3 rounded-sm ${i < (project.neural_density || 3) ? 'bg-blue-500' : 'bg-gray-800'}`} style={{ opacity: 0.2 + (i * 0.15) }} />))}
              <Activity size={10} className="text-gray-700 ml-2" />
            </div>

            <div className="flex gap-4">
              <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-[3] bg-transparent border border-gray-800 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all">Enter Node</button>
              <button className="flex-1 bg-blue-600 flex items-center justify-center rounded-2xl hover:bg-blue-500 shadow-xl shadow-blue-900/30"><Zap size={22} fill="white" stroke="none" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
