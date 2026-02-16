'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase' 
import { Folder, Plus, Calendar, MoreVertical, Loader2 } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setProjects(data || [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('projects')
      .insert([{ name, user_id: user?.id }])

    if (!error) {
      setName('')
      setIsModalOpen(false)
      fetchProjects()
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> New Project
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-[#1e212b] border border-gray-800 p-5 rounded-2xl">
              <Folder className="text-blue-400 mb-3" size={24} />
              <h3 className="font-semibold text-white">{project.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{project.status}</p>
            </div>
          ))}
        </div>
      )}

      {/* Basic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e212b] p-6 rounded-2xl w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <input 
              className="w-full bg-black/20 border border-gray-700 p-3 rounded-xl mb-4"
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-400">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2 bg-blue-600 rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
