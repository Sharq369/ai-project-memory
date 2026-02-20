"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function MemoriesList({ projectId }: { projectId: string }) {
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('code_memories')
        .select('*')
        .eq('project_id', projectId) // Filter for THIS project
        .order('created_at', { ascending: false })

      if (!error) setMemories(data)
      setLoading(false)
    }

    fetchMemories()

    // 🛰️ REAL-TIME UPDATE: Listen for new syncs automatically
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'code_memories' }, 
        (payload) => {
          if (payload.new.project_id === projectId) {
            setMemories((prev) => [payload.new, ...prev])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, supabase])

  if (loading) return <div className="text-gray-500 animate-pulse">Scanning Neural Paths...</div>

  return (
    <div className="grid gap-4 mt-8">
      {memories.length === 0 ? (
        <div className="p-8 border border-dashed border-gray-800 rounded-lg text-center text-gray-600">
          No neural blocks detected. Establish a link to begin.
        </div>
      ) : (
        memories.map((memory) => (
          <div key={memory.id} className="p-4 bg-[#0d0d0d] border border-blue-900/20 rounded-lg hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-400 font-mono text-sm">{memory.file_name}</span>
              <span className="text-xs text-gray-600">
                {new Date(memory.created_at).toLocaleDateString()}
              </span>
            </div>
            <pre className="text-xs text-gray-500 bg-black p-2 rounded overflow-hidden line-clamp-3 font-mono">
              {memory.content}
            </pre>
          </div>
        ))
      )}
    </div>
  )
}
