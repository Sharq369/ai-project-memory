'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { syncGitHubRepo } from '../../../lib/github'
import { Folder, Plus, Loader2, Github, BookOpen, X, AlertCircle } from 'lucide-react'

// ... (Keep SyncModal component from previous response)

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [dailyCount, setDailyCount] = useState(0)
  const [newProject, setNewProject] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. Get all projects for the list
    const { data } = await supabase
      .from('projects')
      .select(`*, memories:memories(count)`)
      .order('created_at', { ascending: false })
    
    // 2. Count projects created TODAY for the limit
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
      alert("🚀 DAILY QUOTA REACHED: You've used your 3 free nodes for today. Reset occurs at midnight, or upgrade for unlimited access.")
      return
    }

    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('projects').insert([{ name: newProject, user_id: user?.id }])
    
    if (!error) {
      setNewProject('')
      fetchProjects()
    }
    setIsCreating(false)
  }

  // ... (Rest of your UI Rendering logic)
  return (
    <div className="max-w-6xl mx-auto space-y-10 p-6">
      <div className="bg-[#16181e] border border-gray-800 p-8 rounded-[2rem] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Project Vault</h1>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
            Daily Usage: {dailyCount} / 3 Nodes Used
          </p>
        </div>
        <form onSubmit={handleCreate} className="flex gap-2">
           <input 
            className="bg-[#0f1117] border border-gray-800 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500" 
            placeholder="New Node Name..." 
            value={newProject} 
            onChange={(e) => setNewProject(e.target.value)} 
          />
          <button className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition-all">
            {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
          </button>
        </form>
      </div>
      
      {/* Grid of projects goes here... */}
    </div>
  )
}
