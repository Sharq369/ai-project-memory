'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, Sparkles, Bot, Send, Clock, Folder, Loader2 } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setHasSearched(true)
    
    // Logic to fetch memories and their linked project names
    const { data, error } = await supabase
      .from('memories')
      .select(`
        *,
        projects ( name )
      `) 
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Search error:', error)
    } else {
      setResults(data || [])
    }
    
    setIsSearching(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-2xl mb-4">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Brain Search</h1>
          <p className="text-gray-500">Search history, notes, and project context.</p>
        </div>

        {/* THE FIX: Flex Container instead of Absolute Positioning */}
        <form 
          onSubmit={handleSearch} 
          className="flex items-center gap-2 bg-[#1e212b] border border-gray-800 rounded-2xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all mb-12 shadow-2xl"
        >
          <div className="pl-3 text-gray-500">
            <Search size={20} />
          </div>
          
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-white text-lg placeholder:text-gray-600"
            placeholder="Search your brain..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button 
            type="submit"
            disabled={isSearching || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white p-3 rounded-xl transition-all flex items-center justify-center min-w-[50px] active:scale-90"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>

        {/* Results Section */}
        <div className="space-y-6">
          {isSearching && (
            <div className="flex flex-col items-center py-12">
              <Bot className="h-10 w-10 text-blue-500 animate-pulse mb-4" />
              <p className="text-sm text-gray-500 font-mono">SCANNING NEURAL NETWORK...</p>
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="text-center py-16 border border-dashed border-gray-800 rounded-3xl text-gray-500">
              No memories matched "{query}"
            </div>
          )}

          <div className="grid gap-4">
            {results.map((item) => (
              <div key={item.id} className="bg-[#1e212b] p-6 rounded-2xl border border-gray-800 hover:border-blue-500/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-500/10 uppercase">
                      {item.tag || 'Observation'}
                    </span>
                    {item.projects?.name && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700 flex items-center gap-1">
                        <Folder size={10} /> {item.projects.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-600 font-mono uppercase">
                    <Clock size={12} />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-gray-200 text-lg leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
