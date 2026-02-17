'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, Sparkles, Bot, ArrowRight, Clock, Folder } from 'lucide-react'

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

    // Simulated "AI Processing" delay
    await new Promise(resolve => setTimeout(resolve, 600))

    // Fetches memories AND the name of the linked project in one go
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
        
        {/* Title Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-2xl mb-4">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Brain Search</h1>
          <p className="text-gray-500">Ask anything. Your AI knows your project history.</p>
        </div>

        {/* Search Input Group */}
        <form onSubmit={handleSearch} className="relative mb-12">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
            <Search className={`h-5 w-5 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
          </div>
          
          <input
            type="text"
            className="w-full bg-[#1e212b] border border-gray-800 rounded-2xl py-4 pl-12 pr-16 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-xl"
            placeholder="Search your memories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button 
            type="submit"
            disabled={isSearching || !query.trim()}
            // z-20 ensures this stays on top of the input for mobile taps
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 rounded-xl transition-all z-20 flex items-center justify-center active:scale-95"
          >
            {isSearching ? '...' : <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        {/* Display Results */}
        <div className="space-y-6">
          {isSearching && (
            <div className="flex flex-col items-center py-12 animate-pulse">
              <Bot className="h-10 w-10 text-blue-500 mb-4" />
              <p className="text-sm text-blue-400 font-medium tracking-widest uppercase">Retrieving Context...</p>
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="text-center py-16 border border-dashed border-gray-800 rounded-3xl">
              <p className="text-gray-500 italic">No neural matches found for "{query}"</p>
            </div>
          )}

          <div className="grid gap-4">
            {results.map((item) => (
              <div key={item.id} className="bg-[#1e212b] p-6 rounded-2xl border border-gray-800 hover:border-blue-500/40 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md border border-blue-500/20 uppercase tracking-tighter">
                      {item.tag || 'Memory'}
                    </span>
                    {/* Shows the project name if linked */}
                    {item.projects?.name && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded-md border border-gray-700 flex items-center gap-1">
                        <Folder size={10} /> {item.projects.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-600">
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
