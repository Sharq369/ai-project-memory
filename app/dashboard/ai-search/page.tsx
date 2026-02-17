'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, Sparkles, Send, Loader2 } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      // DEBUG STEP: We are searching ONLY memories first to rule out Join errors
      const { data, error } = await supabase
        .from('memories')
        .select('*') // Simplified: No project join yet
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        alert("Supabase Error: " + error.message); // This will show on your phone
      } else {
        setResults(data || []);
      }
    } catch (err: any) {
      alert("System Crash: " + err.message);
    } finally {
      setIsSearching(false); // This turns the button back to dark blue
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="text-blue-400" /> AI Brain
          </h1>
        </header>

        <form onSubmit={handleSearch} className="flex gap-2 mb-10 h-14">
          <input
            type="search" // Use 'search' for better mobile keyboard support
            inputMode="search"
            className="flex-1 bg-[#1e212b] border border-gray-800 rounded-2xl px-6 text-white text-lg outline-none focus:border-blue-500"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button 
            type="submit"
            disabled={isSearching}
            className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white active:scale-90 disabled:opacity-30"
          >
            {isSearching ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>

        <div className="space-y-4">
          {results.map((item) => (
            <div key={item.id} className="bg-[#1e212b] border border-gray-800 p-5 rounded-2xl">
              <p className="text-gray-200">{item.content}</p>
              <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          
          {hasSearched && results.length === 0 && !isSearching && (
            <p className="text-center text-gray-600">No results for "{query}"</p>
          )}
        </div>
      </div>
    </div>
  )
}
