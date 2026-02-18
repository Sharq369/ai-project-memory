'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Brain, Search, Database, Cpu, Clock, Tag } from 'lucide-react'

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchMemories() {
      const { data } = await supabase
        .from('memories')
        .select(`*, projects(name)`)
        .order('created_at', { ascending: false })
      if (data) setMemories(data)
      setLoading(false)
    }
    fetchMemories()
  }, [])

  const filteredMemories = memories.filter(m => 
    m.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#16181e] p-8 rounded-[2rem] border border-gray-800/50">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Neural Index</h1>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Browsing {memories.length} stored knowledge blocks</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            className="w-full bg-[#0f1117] border border-gray-800 text-white pl-12 pr-4 py-3 rounded-xl outline-none focus:border-blue-500 text-xs transition-all"
            placeholder="Search memory patterns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center text-gray-600 font-mono text-xs animate-pulse uppercase tracking-widest">Accessing Data Streams...</div>
        ) : filteredMemories.map((memory) => (
          <div key={memory.id} className="group bg-[#16181e] border border-gray-800/50 p-6 rounded-2xl hover:border-blue-500/30 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-tighter">
                    {memory.projects?.name || 'Unassigned Node'}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
                    <Clock size={10} /> {new Date(memory.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed font-medium">
                  {memory.content}
                </p>
                {memory.tags && (
                  <div className="flex gap-2">
                    {memory.tags.map((tag: string) => (
                      <span key={tag} className="text-[9px] text-gray-500 flex items-center gap-1">
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 bg-[#0f1117] border border-gray-800 rounded-xl text-gray-600 group-hover:text-blue-500 transition-colors">
                <Brain size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
