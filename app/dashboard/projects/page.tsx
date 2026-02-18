'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { Folder, Plus, Loader2, X, Github } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [dailyCount, setDailyCount] = useState(0)
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. Fetch all projects to display
    const { data, error } = await supabase
      .from('projects')
      .select(`*, memories:memories(count)`)
      .order('created_at', { ascending: false })
    
    // 2. Calculate daily usage
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .gte('created_at', today)

    if (data) setProjects(data)
    if (count !== null) setDailyCount(count)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dailyCount >= 3) {
      alert("Daily limit reached. Reset at midnight.")
      return
    }
    if (!newProject) return

    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('projects').insert([{ 
      name: newProject, 
      user_id: user?.id 
    }])
    
    if (!error) {
      setNewProject('')
      fetchProjects()
    }
    setIsCreating(false)
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-6">
      {/* HEADER SECTION */}
      <div className="bg-[#16181e] border border-gray-800 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">
            Daily Usage: {dailyCount} / 3 Nodes Used
          </p>
        </div>
        <form onSubmit={handleCreate} className="flex gap-2 w-full md:w-auto">
          <input 
            className="flex-1 md:w-64 bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all" 
            placeholder="New Node Name..." 
            value={newProject} 
            onChange={(e) => setNewProject(e.target.value)} 
          />
          <button className="bg-blue-600 p-4 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
          </button>
        </form>
      </div>

      {/* PROJECT GRID - This is what was missing! */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-[2rem]">
            <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">No active nodes detected.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="group bg-[#16181e] border border-gray-800 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500">
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                  <Folder size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Memory Blocks</p>
                  <p className="text-xl font-black text-white">{project.memories?.[0]?.count || 0}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-8 tracking-tight group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-[#0f1117] border border-gray-800 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-gray-600 transition-all">
                  Sync
                </button>
                <Link 
                  href={`/dashboard/projects/${project.id}/doc`} 
                  className="bg-blue-600/10 border border-blue-500/20 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-blue-400 text-center hover:bg-blue-600 hover:text-white transition-all"
                >
                  Docs
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
