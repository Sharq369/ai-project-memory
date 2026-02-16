'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase' 
import { Search, Filter, Calendar, Trash2, MoreVertical, Plus } from 'lucide-react'

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemories()
  }, [])

  async function fetchMemories() {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching:', error)
    } else {
      setMemories(data || [])
    }
    setLoading(false)
  }

  async function deleteMemory(id: string) {
    if (!confirm('Delete this memory?')) return
    const { error } = await supabase.from('memories').delete().eq('id', id)
    if (!error) setMemories(memories.filter(m => m.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Memories</h1>
            <p className="text-sm text-gray-500">Your total external brain storage.</p>
          </div>
          
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-[#1e212b] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <button className="p-2.5 bg-[#1e212b] border border-gray-800 rounded-xl hover:bg-gray-800 active:scale-95 transition-all">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="space-y-4">
          {loading ? (
             <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-800/50 rounded-xl" />)}
             </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500">No memories found. Start adding some!</p>
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-[#1e212b] border border-gray-800 p-5 rounded-2xl hover:border-gray-700 transition-all group relative">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {memory.tag || 'General'}
                    </span>
                    <p className="text-gray-200 mt-3 leading-relaxed pr-8">{memory.content}</p>
                    
                    <div className="flex items-center gap-4 mt-4 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(memory.created_at).toLocaleDateString()}
                      </span>
                      
                      {/* ---------------------------------------------------------
                          CLAUDE BACKEND SPACE: AI Project linking logic 📌
                          --------------------------------------------------------- */}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => deleteMemory(memory.id)}
                      className="p-2 text-gray-600 hover:text-red-400 active:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-white rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
