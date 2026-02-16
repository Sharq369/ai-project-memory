'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase' // Standard path for app/dashboard/page.tsx
import { Plus, Search, Folder, MoreVertical, Calendar, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [memories, setMemories] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([]) // New state for projects
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newMemory, setNewMemory] = useState('')
  const [tags, setTags] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('') // New state for selection
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

    // Fetch Memories and Projects at the same time
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
        project_id: selectedProjectId || null // This links the memory to the project
      }])

    if (!error) {
      setNewMemory('')
      setTags('')
      setSelectedProjectId('')
      setIsModalOpen(false)
      fetchInitialData() // Refresh list
    } else {
      alert('Error saving memory')
    }
  }

  // ... (Rest of your component UI)
  // Inside your Modal return, add the <select> element before the "Save" button:
  
  /* <select 
      className="w-full bg-[#0f1117] border border-gray-700 rounded-xl p-3 text-white mb-4 outline-none focus:ring-1 focus:ring-blue-500"
      value={selectedProjectId}
      onChange={(e) => setSelectedProjectId(e.target.value)}
    >
      <option value="">No Project (General)</option>
      {projects.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  */
}
