'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Plus, Star, Zap, Search, Loader2, X } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const CATEGORIES = ['All', 'Frontend', 'Backend', 'Fullstack', 'API', 'Other']

export default function ProjectVault() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
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
      { name: newNodeName, category: 'Other', preferred_platform: 'Vercel' }
    ]).select()
    
    if (!error) {
      setProjects([data[0], ...projects])
      setNewNodeName('')
      setIsModalOpen(false)
    }
  }

  const handleManualSync = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation() // Prevents entering the node
    // This triggers a UI "ping" to show it's active
    alert("Neural Sync Triggered. Awaiting GitHub Webhook...")
  }

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => (activeCategory === 'All' || p.category === activeCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [projects, searchTerm, activeCategory])

  if (loading) return <div className="h-screen bg-[#0a0b0e] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-screen bg-[#0a0b0e] text-white font-sans">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">Project Vault</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Nodes Online: {projects.length}</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" placeholder="Search Nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#111319] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold uppercase outline-none focus:border-blue-500 w-full"
          />
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">New Node</button>
        </div>
      </header>

      {/* Category Filter Strip */}
      <div className="flex gap-3 mb-12 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-blue-600 border-blue-500' : 'bg-[#111319] border-gray-800 text-gray-500'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-[#111319] border border-gray-800 rounded-[2.5rem] p-8 hover:border-blue-500/50 transition-all group relative">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black italic uppercase truncate pr-8">{project.name}</h3>
              <Star size={16} className={project.is_favorite ? "text-amber-500 fill-amber-500" : "text-gray-800"} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-1 bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5">Enter Node</button>
              <button onClick={(e) => handleManualSync(e, project.id)} className="bg-blue-600 p-4 rounded-xl hover:scale-110 active:scale-90 transition-transform">
                <Zap size={18} fill="white" stroke="none" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NEW NODE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-md rounded-[3rem] p-10 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X size={24}/></button>
            <h2 className="text-3xl font-black italic uppercase mb-8">Initialize Node</h2>
            <input 
              autoFocus value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="Node Name (e.g., AI TOOLING)"
              className="w-full bg-black/40 border border-gray-800 rounded-2xl p-5 mb-6 text-white font-bold outline-none focus:border-blue-500"
            />
            <button onClick={handleCreateNode} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Create Node</button>
          </div>
        </div>
      )}
    </div>
  )
}
