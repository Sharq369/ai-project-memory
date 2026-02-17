'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, Sparkles, Send, Loader2, Folder, Clock } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isSearching) return;

    // DEBUG: Remove this once it works
    console.log("Search triggered for:", query);

    setIsSearching(true);
    setHasSearched(true);

    const { data, error } = await supabase
      .from('memories')
      .select('*, projects(name)')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) console.error('Error:', error);
    else setResults(data || []);
    
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="text-blue-400" /> AI Search
          </h1>
        </header>

        {/* THE FIXED SEARCH UNIT */}
        <div className="flex flex-col gap-3 mb-10">
          <form onSubmit={handleSearch} className="flex gap-2 h-14">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-500" />
              </div>
              <input
                type="text"
                className="w-full h-full bg-[#1e212b] border border-gray-800 rounded-2xl pl-12 pr-4 text-white text-base outline-none focus:border-blue-500"
                placeholder="Search memories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              // Explicit onClick for mobile browsers that fail form submission
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              // p-4 and min-w-[60px] creates a massive, easy-to-tap hit area
              className="h-14 min-w-[60px] bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 active:bg-blue-700 transition-all z-50 pointer-events-auto"
            >
              {isSearching ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
          <p className="text-[10px] text-gray-600 px-2 uppercase tracking-widest">
            {isSearching ? 'Analyzing neural patterns...' : 'Tap send to search'}
          </p>
        </div>

        {/* RESULTS AREA */}
        <div className="space-y-4">
          {!isSearching && hasSearched && results.length === 0 && (
            <div className="text-center py-10 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
              No results for "{query}"
            </div>
          )}

          {results.map((item) => (
            <div key={item.id} className="bg-[#1e212b] border border-gray-800 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase">{item.tag || 'Memory'}</span>
                {item.projects?.name && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Folder size={10} /> {item.projects.name}
                  </span>
                )}
              </div>
              <p className="text-gray-200 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
