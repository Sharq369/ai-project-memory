'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Send, Loader2, Search } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Pure function - no "event" needed
  const triggerSearch = async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .ilike('content', `%${query}%`);

      if (error) alert(error.message);
      else setResults(data || []);
    } catch (err) {
      alert("Connection failed");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] p-6 text-white">
      <div className="max-w-xl mx-auto pt-10">
        
        <h1 className="text-xl font-bold mb-8 text-center flex items-center justify-center gap-2">
          <Search size={20} className="text-blue-400" /> AI Neural Search
        </h1>

        {/* Removed <form> to prevent mobile keyboard interference */}
        <div className="flex items-center gap-2 bg-[#1e212b] p-2 rounded-2xl border border-gray-800 shadow-2xl">
          <input
            type="text"
            className="flex-1 bg-transparent py-3 px-4 outline-none text-lg"
            placeholder="Search your brain..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // Allows the "Enter" key on keyboard to work without a form tag
            onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
          />

          <button 
            // Standard button without type="submit"
            onClick={triggerSearch}
            disabled={isSearching}
            className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center active:scale-90 active:bg-blue-700 transition-transform shadow-lg"
          >
            {isSearching ? (
              <Loader2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              <Send size={20} className="text-white" />
            )}
          </button>
        </div>

        {/* Results Area */}
        <div className="mt-10 space-y-4">
          {results.map((item) => (
            <div key={item.id} className="bg-[#1e212b] p-5 rounded-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
              <p className="text-gray-200 leading-relaxed">{item.content}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 uppercase font-bold">
                  {item.tag || 'Memory'}
                </span>
              </div>
            </div>
          ))}

          {results.length === 0 && !isSearching && query && (
             <p className="text-center text-gray-500 text-sm italic">Nothing found for "{query}"</p>
          )}
        </div>
      </div>
    </div>
  )
}
