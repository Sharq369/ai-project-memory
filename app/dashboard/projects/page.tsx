'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Zap, Loader2, Globe, Edit2, RefreshCw } from 'lucide-react'

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const router = useRouter()

  // Load projects on page load
  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setProjects(data)
    } catch (error: any) {
      console.error('Error fetching projects:', error.message)
    } finally {
      setLoading(false)
    }
  }

  // The "Loud" Sync Function
  const handleSync = async (projectId: string, repoUrl: string) => {
    try {
      setSyncingId(projectId)
      
      // 1. Alert to confirm the tap registered on mobile
      alert(`Starting sync for node...\nTarget: ${repoUrl || 'Unknown Repo'}`)

      // 2. Call the sync API (Make sure '/api/sync' matches your actual backend route)
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, repoUrl })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Sync failed at the server. Check Vercel logs.")
      }

      // 3. Success Alert
      alert("Sync Complete! Memory blocks retrieved successfully.")
      fetchProjects() // Refresh the UI data

    } catch (error: any) {
      // 4. Error Alert - This will tell us exactly why it's failing
      alert(`SYNC ERROR:\n${error.message}\n\nThis is usually a database missing column or a bad API route.`)
    } finally {
      setSyncingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1117]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8 lg:p-12">
      <div className="max-w-6xl mx-auto pb-20">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter mb-2">Project Vault</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">
            Nodes Active: {projects.length}
          </p>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#16181e] border border-gray-800 rounded-[2rem] p-8 flex flex-col justify-between transition-all hover:border-gray-700">
              
              {/* Card Top Icons */}
              <div className="flex justify-between items-start mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Globe size={18} className="text-blue-500" />
                </div>
                <div className="flex gap-3 text-gray-600">
                  <button className="hover:text-white transition-colors"><Edit2 size={16} /></button>
                  <button className="hover:text-white transition-colors"><RefreshCw size={16} /></button>
                </div>
              </div>

              {/* Card Info */}
              <div className="mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{project.name}</h2>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">
                  Memory Blocks Active
                </p>
                <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest">
                  Sync: {project.last_sync ? new Date(project.last_sync).toLocaleTimeString() : 'Never'}
                </p>
              </div>

              {/* Card Actions */}
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push(`/dashboard/projects/${project.id}/doc`)}
                  className="flex-1 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
                >
                  Enter Node
                </button>
                
                {/* The Debugging Sync Button */}
                <button 
                  onClick={() => handleSync(project.id, project.repo_url)}
                  disabled={syncingId === project.id}
                  className={`p-4 rounded-2xl transition-all shadow-lg flex items-center justify-center min-w-[56px] ${
                    syncingId === project.id 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 hover:scale-105 shadow-blue-900/40'
                  }`}
                >
                  {syncingId === project.id ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <Zap size={20} fill="white" className="text-white" />
                  )}
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
