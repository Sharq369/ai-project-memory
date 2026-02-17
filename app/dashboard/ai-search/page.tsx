'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Send, Loader2 } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .ilike('content', `%${query}%`);

      if (error) alert(error.message);
      else setResults(data || []);
    } catch (err: any) {
      alert("System Error");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    // pointer-events-none makes the background "invisible" to touches
    <div className="min-h-screen bg-[#0f1117] p-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pt-10">
        
        <div className="mb-8 text-center">
          <h1 className="text-white text-2xl font-bold">Search Brain</h1>
        </div>

        <form 
          onSubmit={handleSearch} 
          className="flex gap-2 h-16 pointer-events-auto" // Re-enables touch here
        >
          <input
            type="text"
            className="flex-1 bg-[#1e212b] border-2 border-gray-800 rounded-2xl px-4 text-white outline-none focus:border-blue-500"
            placeholder="Type here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button 
            type="submit"
            onClick={() => handleSearch()}
            className="w-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white active:bg-blue-800 active:scale-95 shadow-2xl"
            style={{ touchAction: 'manipulation', WebkitAppearance: 'none' }}
          >
            {isSearching ? <Loader2 className="animate-spin" /> : <Send size={24} />}
          </button>
        </form>

        <div className="mt-10 space-y-4 pointer-events-auto">
          {results.map((item) => (
            <div key={item.id} className="bg-[#1e212b] p-4 rounded-xl border border-gray-800">
              <p className="text-white">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
