"use client"
import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Trash2, Code, FileText, Database } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MemoriesList({ projectId }: { projectId: string }) {
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMemories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('code_memories')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (!error) setMemories(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMemories()
  }, [projectId])

  // --- DELETE FUNCTION ---
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this file from Neural Memory?")) return

    const { error } = await supabase
      .from('code_memories')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Error deleting: " + error.message)
    } else {
      // Refresh the list immediately
      setMemories(prev => prev.filter(m => m.id !== id))
    }
  }

  if (loading) return <div className="text-blue-400 animate-pulse">Scanning Neural Nodes...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {memories.length === 0 && (
        <div className="text-gray-500 border border-dashed border-gray-800 p-8 rounded-lg text-center col-span-2">
          No memory shards found for this project.
        </div>
      )}

      {memories.map((memory) => (
        <div 
          key={memory.id} 
          className="group relative bg-[#0a0a0c] border border-gray-800 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300 shadow-lg"
        >
          {/* Delete Button - Appears on hover */}
          <button 
            onClick={() => handleDelete(memory.id)}
            className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors duration-200 z-10"
            title="Delete memory shard"
          >
            <Trash2 size={18} />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Code className="text-blue-400" size={20} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="text-gray-200 font-medium truncate pr-6">
                {memory.file_name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-mono">
                Shard ID: {memory.id.slice(0, 8)}
              </p>
              <div className="mt-3 bg-black/50 rounded p-2 overflow-hidden">
                <pre className="text-[10px] text-blue-300/70 font-mono truncate">
                  {memory.content.substring(0, 100)}...
                </pre>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
