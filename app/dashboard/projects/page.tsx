'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Star, Zap, Search, Loader2, X, Plus } from 'lucide-react'

export default function ProjectVault() {
  const router = useRouter()
  
  // Initialize the Supabase client for the browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewNodeOpen, setIsNewNodeOpen] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')

  const filters = ['ALL', 'FRONTEND', 'BACKEND', 'FULLSTACK', 'API', 'OTHER']

  // Load Projects from Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Error fetching projects:", error.message)
      } else if (data) {
        setProjects(data)
      }
      setLoading(false)
    }
    fetchProjects()
  }, [supabase])

  // ISSUE 1 FIX: Handle Create Node with User ID and Error Logging
  const handleCreateNode = async () => {
    if (!newNodeName.trim()) return

    console.log("Triggering node creation for:", newNodeName)

    // 1. Get the current user session
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert("Authentication error: Please log in again.")
      router.push('/') // Redirect to login if no user found
      return
    }

    // 2. Insert the project with the user_id to satisfy RLS
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        name: newNodeName, 
        user_id: user.id, // REQUIRED for RLS
        preferred_platform: 'Vercel' 
      }])
      .select()
    
    if (error) {
      console.error("Supabase Creation Error:", error.message)
      alert(`Creation failed: ${error.message}`)
      return
    }

    if (data) {
      console.log("Success! Node created:", data[0])
      setProjects([data[0], ...projects])
      setNewNodeName('')
      setIsNewNodeOpen(false)
    }
  }

  const handleSocialLogin = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0b0e] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-12 min-h-screen bg-[#0a0b0e] text-white">
      {/* HEADER */}
      <header className="mb-12 flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-none">PROJECT VAULT</h1>
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] mt-4">
              NEURAL NODES ACTIVE: {projects.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH NODES..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111319] border border-gray-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 w-64 transition-all"
              />
            </div>
            <button 
              onClick={() => setIsNewNodeOpen(true)} 
              className="bg-blue-600 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2"
            >
              <Plus size={14} /> New Node
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          {filters.map(f => (
            <button 
              key={f} 
              onClick={() => setActiveFilter(f)}
              className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                activeFilter === f 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* PROJECT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] p-10 hover:border-blue-600/40 transition-all group">
            <div className="flex justify-between items-start mb-10">
              <h3 className="text-2xl font-black italic uppercase truncate pr-4">{project.name}</h3>
              <Star size={14} className="text-gray-800 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)} 
                className="flex-1 bg-transparent border border-gray-800 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Enter Node
              </button>
              <button className="bg-blue-600 p-4 rounded-xl hover:scale-105 transition-all">
                <Zap size={18} fill="white" stroke="none" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NEW NODE MODAL */}
      {isNewNodeOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative shadow-2xl shadow-blue-900/20">
            <button onClick={() => setIsNewNodeOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors">
              <X size={18}/>
            </button>
            <h2 className="text-xl font-black italic uppercase mb-8 tracking-tight">INITIALIZE NODE</h2>
            <input 
              autoFocus
              value={newNodeName} 
              onChange={(e) => setNewNodeName(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNode()}
              placeholder="NODE DESIGNATION..." 
              className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 mb-6 transition-all"
            />
            <button 
              onClick={handleCreateNode} 
              className="w-full bg-blue-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              CREATE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
