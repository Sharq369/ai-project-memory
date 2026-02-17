'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase' 
import { Plus, Search, Folder, MoreVertical, Calendar, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [memories, setMemories] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newMemory, setNewMemory] = useState('')
  const [tags, setTags] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('') 
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Fetch Memories and Projects simultaneously
    const [memRes, projRes] = await Promise.all([
      supabase.from('memories').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name')
    ])

    if (memRes.data) setMemories(memRes.data)
    if (projRes.data) setProjects(projRes.data)
    setLoading(false)
  }

  async function addMemory() {
    if (!newMemory.trim()) return
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('memories')
      .insert([{ 
        user_id: user?.id, 
        content: newMemory, 
        tag: tags,
        project_id: selectedProjectId || null // This links the memory to your "AI tooling" project
      }])

    if (!error) {
      setNewMemory(''); setTags(''); setSelectedProjectId('');
      setIsModalOpen(false)
      fetchInitialData()
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-6">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-4 py-2 rounded-lg text-white flex items-center gap-2">
          <Plus size={18} /> Add Memory
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? <p>Syncing brain...</p> : memories.map((memory) => (
          <div key={memory.id} className="bg-[#1e212b] p-5 rounded-2xl border border-gray-800">
            <div className="flex justify-between mb-3">
              <span className="text-xs font-bold text-blue-400 uppercase">{memory.tag || 'General'}</span>
            </div>
            <p className="text-gray-200 mb-4">{memory.content}</p>
            <div className="pt-3 border-t border-gray-800 text-[10px] text-gray-500 flex justify-between items-center">
               <span>{new Date(memory.created_at).toLocaleDateString()}</span>
               {/* Show a small folder icon if the memory is linked to a project */}
               {memory.project_id && (
                 <span className="flex items-center gap-1 text-blue-400 font-medium">
                   <Folder size={10} /> Linked
                 </span>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL WITH PROJECT SELECTOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e212b] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">New Memory</h2>
            
            <textarea 
              className="w-full bg-[#0f1117] border border-gray-700 rounded-xl p-3 text-white mb-4 h-24 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What did you learn?"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
            />

            <label className="text-xs text-gray-500 mb-2 block">Link to Project</label>
            <select 
              className="w-full bg-[#0f1117] border border-gray-700 rounded-xl p-3 text-white mb-6 outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">General (No Project)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400">Cancel</button>
              <button onClick={addMemory} className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold">Save Memory</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
