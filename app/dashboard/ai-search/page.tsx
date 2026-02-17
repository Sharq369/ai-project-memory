'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Send, Loader2 } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const triggerSearch = async () => {
    // 1. TEST: If you see this alert, your button and keyboard are working 100%
    alert("Button is working! Attempting to connect to Supabase...");
    
    if (!query.trim() || isSearching) return;
    setIsSearching(true);

    try {
      // 2. Fetch data
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .ilike('content', `%${query}%`);

      if (error) {
        alert("Supabase Error: " + error.message);
      } else {
        setResults(data || []);
        if (data?.length === 0) alert("Connected, but 0 results found.");
      }
    } catch (err: any) {
      alert("System Error: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] p-6 text-white">
      <div className="max-w-xl mx-auto pt-10">
        <h1 className="text-xl font-bold mb-8 text-center">Neural Search Test</h1>

        <div className="flex items-center gap-2 bg-[#1e212b] p-2 rounded-2xl border border-gray-800">
          <input
            type="text"
            className="flex-1 bg-transparent py-3 px-4 outline-none"
            placeholder="Type 'Code' then tap blue button..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
          />

          <button 
            onClick={triggerSearch}
            className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center active:bg-blue-400"
          >
            {isSearching ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {results.map((item) => (
            <div key={item.id} className="bg-[#1e212b] p-4 rounded-xl border border-gray-700">
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
