'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, Sparkles, Bot, ArrowRight, Clock } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    setResults([])

    // 1. Simulate "AI Thinking" delay for effect
    await new Promise(resolve => setTimeout(resolve, 800))

    // 2. Perform the search (Case-insensitive match)
    const { data, error } = await supabase
      .from('memories')
      .select(`
        *,
        projects ( name )
      `) // This grabs the project name automatically!
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
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-2xl mb-4">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ask your Second Brain</h1>
          <p className="text-gray-500">Search through your memories, ideas, and projects.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-12">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
          </div>
          <input
            type="text"
            className="w-full bg-[#1e212b] border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-lg shadow-blue-900/5"
            placeholder="e.g. 'project ideas' or 'meeting notes'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-4 rounded-xl transition-all"
          >
            {isSearching ? 'Thinking...' : <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        {/* Results Area */}
        <div className="space-y-6">
          {isSearching && (
            <div className="flex flex-col items-center py-10 opacity-50">
              <Bot className="h-8 w-8 text-blue-400 animate-bounce mb-4" />
              <p className="text-sm">Scanning neural network...</p>
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500">No memories found for "{query}".</p>
            </div>
          )}

          <div className="space-y-4">
            {results.map((item) => (
              <div key={item.id} className="bg-[#1e212b] p-6 rounded-2xl border border-gray-800 hover:border-blue-500/30 transition-all animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded uppercase tracking-wider">
                      {item.tag || 'Memory'}
                    </span>
                    {/* Display Linked Project Name if it exists */}
                    {item.projects && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700 flex items-center gap-1">
                        📂 {item.projects.name}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-200 leading-relaxed text-lg">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
