'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const emergencyTest = async () => {
    alert("TOUCH REGISTERED"); // If you don't see this, the button isn't the problem, the cache is.
    setIsSearching(true);
    const { data } = await supabase.from('memories').select('*').limit(1);
    alert("Supabase Data Received: " + JSON.stringify(data));
    setIsSearching(false);
  }

  return (
    // fixed top-0 left-0 w-full h-full puts this on a layer ABOVE your sidebar/layout
    <div className="fixed top-0 left-0 w-full h-full bg-[#0f1117] z-[9999] p-10">
      <h1 className="text-white mb-5">EMERGENCY OVERRIDE SEARCH</h1>
      <input 
        className="w-full p-4 mb-4 bg-gray-800 text-white rounded"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type here..."
      />
      <button 
        onClick={emergencyTest}
        className="w-full p-5 bg-blue-600 text-white font-bold rounded-2xl active:bg-red-500"
      >
        {isSearching ? "LOADING..." : "TAP THIS BIG BUTTON"}
      </button>
    </div>
  )
}
