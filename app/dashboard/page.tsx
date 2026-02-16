'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase' // Using your corrected path
import { Plus, Search, MoreVertical, Calendar, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [memories, setMemories] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newMemory, setNewMemory] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchMemories()
  }, [])

  async function fetchMemories() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching memories:', error)
    else setMemories(data || [])
    setLoading(false)
  }

  // --- DELETE FUNCTION ---
  async function deleteMemory(id: string) {
    if (!confirm('Are you sure you want to delete this memory?')) return

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting memory')
    } else {
      // Optimistic UI update: Remove from list without reloading
      setMemories(memories.filter(m => m.id !== id))
    }
  }

  // --- ADD FUNCTION ---
  async function addMemory() {
    if (!newMemory.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('memories')
      .insert([{ user_id: user.id, content: newMemory, tag: tags }])

    if (error) {
      alert('Error saving memory!')
    } else {
      setNewMemory('')
      setTags('')
      setIsModalOpen(false)
      fetchMemories()
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 font-sans">
      <header className="border-b border-gray-800 bg-[#0f1117] p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-white">My Second Brain</h1>
        <button 
          onClick={() => alert("Projects feature coming soon!")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Project
        </button>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search your memories..."
              className="w-full bg-[#1e212b] border border-gray-800 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-500"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            <Plus className="h-5 w-5" />
            Add Memory
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-500">Loading your brain...</p>
          ) : memories.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-[#1e212b] rounded-2xl border border-gray-800 border-dashed">
              <p className="text-gray-400">No memories yet. Add your first one!</p>
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-[#1e212b] p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full font-medium border border-blue-500/20">
                    {memory.tag || 'Idea'}
                  </span>
                  <button 
                    onClick={() => deleteMemory(memory.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4 min-h-[60px]">
                  {memory.content}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-800/50">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(memory.created_at).toLocaleDateString()}
                  </span>
                  
                  {/* ---------------------------------------------------------
                      SPACE FOR CLAUDE CODE / BACKEND LOGIC 📌
                      Insert AI context summary or project linking logic here.
                      ---------------------------------------------------------
                  */}
                  
                  <button className="text-gray-500 hover:text-white transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL SECTION REMAINS SAME AS PREVIOUS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e212b] rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Store a New Memory</h2>
            <textarea
              placeholder="What's on your mind?"
              className="w-full h-32 bg-[#0f1117] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
            />
            <input
              type="text"
              placeholder="Tag (e.g., Work, Idea, Personal)"
              className="w-full bg-[#0f1117] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none mb-6"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-700 text-gray-300">Cancel</button>
              <button onClick={addMemory} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium">Save Memory</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
