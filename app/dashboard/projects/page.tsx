'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Star, Zap, Search, Loader2, X } from 'lucide-react'

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
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')

  const filters = ['ALL', 'FRONTEND', 'BACKEND', 'FULLSTACK', 'API', 'OTHER']

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) setProjects(data)
      setLoading(false)
    }
    fetchProjects()
  }, [supabase])

  const handleCreateNode = async () => {
    if (!newNodeName.trim()) return
    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: newNodeName, preferred_platform: 'Vercel' }])
      .select()
    
    if (!error && data) {
      setProjects([data[0], ...projects])
      setNewNodeName('')
      setIsNewNodeOpen(false)
    }
  }

  // Proper Supabase OAuth Login
  const handleSocialLogin = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // This tells Supabase to send the user to your new callback route
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
              className="bg-blue-600 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              New Node
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
              <button onClick={() => setIsSourceOpen(true)} className="bg-blue-600 p-4 rounded-xl hover:scale-105 transition-all">
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
            <button onClick={handleCreateNode} className="w-full bg-blue-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              CREATE
            </button>
          </div>
        </div>
      )}

      {/* SOURCE SELECTION MODAL */}
      {isSourceOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111319] border border-gray-800 w-full max-w-sm rounded-[2.5rem] p-10 relative">
            <button onClick={() => setIsSourceOpen(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white">
              <X size={18}/>
            </button>
            <h2 className="text-xl font-black italic uppercase mb-8 tracking-tight">SOURCE PROTOCOL</h2>
            <div className="space-y-3">
              {(['github', 'gitlab', 'bitbucket'] as const).map((provider) => (
                <button 
                  key={provider} 
                  onClick={() => handleSocialLogin(provider)} 
                  className="w-full bg-black/40 border border-gray-800/60 p-5 rounded-2xl flex justify-between items-center group hover:border-blue-600 transition-all"
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white">
                    {provider}
                  </span>
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
