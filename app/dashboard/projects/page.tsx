'use client'

import { useEffect, useState, useMemo } from 'react'
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
  Layers,
  Database,
  Pencil,
  Trash2,
  Search,
  Filter,
  Tag,
  ChevronDown
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Define our Protocol Classifications
const CATEGORIES = ['All', 'Frontend', 'Backend', 'Fullstack', 'API', 'Mobile', 'Other']

export default function ProjectVault() {
  const router = useRouter()
  
  // State Management
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  
  // Modals
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editNode, setEditNode] = useState<any>(null)
  
  // Form State
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    fetchProjects()
    return () => subscription.unsubscribe()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Dual-layer Filtering: Search + Category
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [projects, searchTerm, activeCategory])

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNodeName.trim()) return
    setIsProcessing(true)
    try {
      const { data, error } = await supabase.from('projects')
        .insert([{ name: newNodeName, category: newCategory }])
        .select()
      if (error) throw error
      setProjects([data[0], ...projects])
      setNewNodeName('')
      setIsCreateModalOpen(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim() || !editNode) return
    setIsProcessing(true)
    try {
      const { error } = await supabase.from('projects')
        .update({ name: editName, category: editCategory })
        .eq('id', editNode.id)
      if (error) throw error
      setProjects(projects.map(p => p.id === editNode.id ? { ...p, name: editName, category: editCategory } : p))
      setEditNode(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteNode = async (id: string) => {
    if (!confirm("Terminate Protocol: Proceed with deletion?")) return
    setIsProcessing(true)
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      setProjects(projects.filter(p => p.id !== id))
      setEditNode(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOAuth = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      })
      if (error) throw error
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="relative max-w-7xl mx-auto p-4 md:p-10 min-h-screen">
      
      {/* SESSION MONITOR */}
      <div className="flex justify-between items-center mb-12 bg-[#111319] p-5 rounded-[2rem] border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl border ${session ? 'bg-blue-500/10 border-blue-500/20' : 'bg-gray-500/10 border-gray-800'}`}>
            {session ? <UserCheck className="text-blue-500" size={20} /> : <ShieldAlert className="text-gray-500" size={20} />}
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${session ? 'text-blue-500' : 'text-gray-500'}`}>
              {session ? 'Protocol Active' : 'No Active Session'}
            </span>
            {session && <span className="text-gray-500 text-[9px] mt-1 font-bold">{session.user.email}</span>}
          </div>
        </div>
        {session && (
          <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-black text-gray-600 hover:text-red-500 uppercase tracking-widest transition-all">
            Terminate Session
          </button>
        )}
      </div>

      <header className="mb-10">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
          <div>
            <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 text-white leading-none">Project Vault</h1>
            <div className="flex items-center gap-6">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-600/5 border border-blue-500/20 rounded-full text-blue-500">
                <Layers size={12} /><p className="text-[9px] font-black uppercase tracking-[0.4em]">Nodes: {projects.length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" placeholder="SEARCH NODES..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111319] border border-gray-800 rounded-2xl py-5 pl-16 pr-6 text-[11px] text-white font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-800"
              />
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-xl">
               <Plus size={18} strokeWidth={3} /> New Node
            </button>
          </div>
        </div>
      </header>

      {/* CATEGORY FILTER BAR */}
      <div className="flex items-center gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              activeCategory === cat 
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
              : 'bg-[#111319] border-gray-800 text-gray-600 hover:text-white hover:border-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[3rem] p-10 relative shadow-2xl hover:border-blue-500/40 transition-all group overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-blue-400 transition-colors truncate mb-1">
                      {project.name}
                    </h2>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500/60 py-1 px-2 border border-blue-500/20 rounded-md bg-blue-500/5">
                      {project.category || 'Legacy'}
                    </span>
                  </div>
                  <button onClick={() => { setEditNode(project); setEditName(project.name); setEditCategory(project.category || 'Frontend'); }} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <Pencil size={16} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 font-bold uppercase mb-12 mt-6 tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Encrypted Node
                </p>
                <div className="flex gap-4">
                  <button onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} className="flex-[3] bg-transparent border border-gray-800 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all">
                    Enter Node
                  </button>
                  <button onClick={() => setSelectedNode(project)} className="flex-1 bg-blue-600 flex items-center justify-center rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30">
                    <Zap size={22} fill="white" stroke="none" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-32 bg-[#111319]/50 border border-dashed border-gray-800 rounded-[4rem] flex flex-col items-center justify-center text-center">
              <Filter className="text-gray-800 mb-6" size={48} />
              <h3 className="text-xl font-black italic uppercase text-gray-700 tracking-tighter">Node Sequence Not Found</h3>
              <p className="text-[10px] text-gray-800 font-bold uppercase tracking-widest mt-2">Adjust filtering parameters</p>
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editNode && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setEditNode(null)} />
          <form onSubmit={handleUpdateNode} className="relative bg-[#0f1116] border border-gray-800 rounded-[3.5rem] p-12 w-full max-w-md shadow-2xl">
            <h3 className="text-3xl font-black italic uppercase mb-2 text-white tracking-tighter">Edit Protocol</h3>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em] mb-10">Configure Neural Node</p>
            
            <input 
              autoFocus required value={editName} onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[#16181e] border border-gray-800 rounded-2xl py-6 px-8 text-[11px] text-white font-black uppercase tracking-widest outline-none focus:border-blue-500 mb-4"
            />
            
            <div className="relative mb-8">
              <select 
                value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                className="w-full bg-[#16181e] border border-gray-800 rounded-2xl py-6 px-8 text-[11px] text-white font-black uppercase tracking-widest outline-none appearance-none focus:border-blue-500"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={16} />
            </div>

            <div className="flex gap-4">
              <button disabled={isProcessing} className="flex-1 bg-white text-black py-6 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
                Sync Changes
              </button>
              <button type="button" onClick={() => handleDeleteNode(editNode.id)} className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                <Trash2 size={20} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsCreateModalOpen(false)} />
          <form onSubmit={handleCreateNode} className="relative bg-[#0f1116] border border-gray-800 rounded-[3.5rem] p-12 w-full max-w-md shadow-2xl">
            <h3 className="text-3xl font-black italic uppercase mb-8 text-white tracking-tighter">Initialize Node</h3>
            
            <div className="relative mb-4">
              <Database className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
              <input 
                autoFocus required value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="NODE NAME"
                className="w-full bg-[#16181e] border border-gray-800 rounded-2xl py-6 pl-16 pr-6 text-[11px] text-white font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="relative mb-10">
              <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <select 
                value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-[#16181e] border border-gray-800 rounded-2xl py-6 pl-16 pr-12 text-[11px] text-white font-black uppercase tracking-widest outline-none appearance-none focus:border-blue-500"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={16} />
            </div>

            <button disabled={isProcessing} className="w-full bg-white text-black py-6 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
              {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : 'Instantiate Protocol'}
            </button>
          </form>
        </div>
      )}

      {/* CONNECT SOURCE MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedNode(null)} />
          <div className="relative bg-[#0f1116] border border-gray-800 rounded-[3.5rem] p-12 w-full max-w-md shadow-2xl">
            <h3 className="text-3xl font-black italic uppercase mb-10 text-white tracking-tighter">Connect Protocol</h3>
            <div className="space-y-5">
              <button onClick={() => handleOAuth('github')} className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 text-white font-bold text-[11px] tracking-widest hover:border-blue-600 transition-all">
                <div className="flex items-center gap-5"><Github size={24}/> GITHUB AUTH</div><Zap size={16} className="text-gray-700" />
              </button>
              <button onClick={() => handleOAuth('gitlab')} className="w-full flex items-center justify-between bg-[#16181e] p-7 rounded-[2rem] border border-gray-800 text-white font-bold text-[11px] tracking-widest hover:border-orange-600 transition-all">
                <div className="flex items-center gap-5"><Gitlab size={24}/> GITLAB AUTH</div><Zap size={16} className="text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
