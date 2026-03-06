'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, Sparkles, Loader2, Folder, ArrowRight, Brain } from 'lucide-react'
import Link from 'next/link'

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('')
  const [projectResults, setProjectResults] = useState<any[]>([])
  const [memoryResults, setMemoryResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    // Parallel Search: Project names AND Memory content
    const [projRes, memRes] = await Promise.all([
      supabase.from('projects').select('*').ilike('name', `%${query}%`).limit(5),
      supabase.from('memories').select('*, projects(name)').ilike('content', `%${query}%`).limit(10)
    ])

    setProjectResults(projRes.data || [])
    setMemoryResults(memRes.data || [])
    setIsSearching(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 mb-4">
            <Sparkles className="text-blue-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Global Intelligence Search</h1>
          <p className="text-gray-500 text-sm mt-2">Scanning Projects & Knowledge Base</p>
        </div>

        {/* Search Bar */}
        <div className="bg-[#16181e] rounded-2xl border border-gray-800 p-2 mb-12 shadow-2xl">
          <div className="flex items-center px-4 gap-3">
            <Search size={18} className="text-gray-500" />
            <input
              className="flex-1 bg-transparent py-4 outline-none text-white placeholder:text-gray-600 text-lg"
              placeholder="Search projects or memories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="bg-blue-600 h-12 px-8 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : 'Execute'}
            </button>
          </div>
        </div>

        {/* Unified Results Feed */}
        <div className="space-y-10">
          
          {/* PROJECTS SECTION */}
          {projectResults.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Folder className="text-blue-500" size={16} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Project Nodes</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectResults.map(p => (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}/doc`}>
                    <div className="bg-[#16181e] p-5 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all group">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">{p.name}</span>
                        <ArrowRight size={14} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* MEMORIES SECTION */}
          {memoryResults.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Brain className="text-purple-500" size={16} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Knowledge Fragments</h2>
              </div>
              <div className="space-y-3">
                {memoryResults.map(m => (
                  <div key={m.id} className="bg-[#16181e]/40 border border-gray-800 p-5 rounded-2xl hover:bg-[#16181e] transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded uppercase">{m.projects?.name}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{m.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasSearched && projectResults.length === 0 && memoryResults.length === 0 && (
            <div className="text-center py-20 bg-[#16181e]/20 rounded-[3rem] border border-dashed border-gray-800">
              <p className="text-gray-500">No intelligence found for "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
