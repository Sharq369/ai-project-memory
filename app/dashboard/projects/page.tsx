'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { syncGitHubRepo } from '../../../lib/github'
import { Folder, Plus, Loader2, Github, BookOpen, X, Crown } from 'lucide-react'

// Reuse the SyncModal component from your previous version here...

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const userPlan = 'Free' // This will be dynamic later
  const projectLimit = 3

  useEffect(() => { 
    async function fetchProjects() {
      const { data } = await supabase.from('projects').select(`*, memories:memories(count)`).order('created_at', { ascending: false })
      if (data) setProjects(data)
      setLoading(false)
    }
    fetchProjects() 
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (projects.length >= projectLimit) {
      alert("Upgrade to Premium to create more projects.")
      return
    }
    // ... insert logic from previous script
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#16181e] p-8 rounded-[2rem] border border-gray-800/50">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tighter">Project Vault</h1>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">{userPlan} Tier</span>
          </div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">{projects.length} / {projectLimit} Nodes Occupied</p>
        </div>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input className="bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 w-64" placeholder="New Project..." value={newProject} onChange={(e) => setNewProject(e.target.value)} />
          <button className="bg-blue-600 text-white p-3 rounded-xl"><Plus size={24} /></button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#16181e] border border-gray-800 p-8 rounded-[2rem] hover:border-blue-500/30 transition-all">
            <div className="flex justify-between mb-6">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Folder size={24} /></div>
              <div className="text-right"><p className="text-[10px] font-bold text-gray-600 uppercase">Blocks</p><p className="text-xl font-black text-white">{project.memories?.[0]?.count || 0}</p></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-8">{project.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#0f1117] border border-gray-800 py-4 rounded-2xl text-[10px] font-bold text-gray-500 uppercase">Sync</button>
              <Link href={`/dashboard/projects/${project.id}/doc`} className="bg-blue-600/10 border border-blue-500/20 py-4 rounded-2xl text-[10px] font-bold text-blue-400 text-center uppercase">Docs</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
