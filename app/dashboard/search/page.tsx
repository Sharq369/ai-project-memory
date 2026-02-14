'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Send, BrainCircuit, History } from 'lucide-react';

export default function AISearchPage() {
  const [query, setQuery] = useState('');

  const suggestions = [
    "What was the schema for the database?",
    "Summarize my recent project notes",
    "Find memories related to UI design"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Sparkles className="text-blue-500" />
          AI Brain Search
        </h1>
        <p className="text-zinc-400 text-lg">Ask anything. Your AI knows your project history.</p>
      </div>

      {/* Search Input Box */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
        <div className="relative flex items-center bg-[#121212] border border-white/10 rounded-xl p-2">
          <div className="pl-4 text-zinc-500">
            <BrainCircuit size={20} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your external brain..."
            className="flex-1 bg-transparent border-none px-4 py-3 text-white focus:outline-none text-lg"
          />
          <button className="bg-blue-600 hover:bg-blue-500 p-3 rounded-lg text-white transition-all shadow-lg shadow-blue-600/20">
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {suggestions.map((text, i) => (
          <button 
            key={i}
            onClick={() => setQuery(text)}
            className="p-4 bg-white/5 border border-white/10 rounded-xl text-left text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-start gap-3"
          >
            <History size={16} className="mt-0.5 shrink-0" />
            {text}
          </button>
        ))}
      </div>

      {/* Placeholder for Results */}
      <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center">
        <div className="inline-flex p-4 bg-blue-500/10 rounded-full text-blue-500 mb-4">
          <Search size={32} />
        </div>
        <h3 className="text-white font-medium">No active search</h3>
        <p className="text-zinc-500 text-sm mt-1">Start typing to retrieve context from your vault.</p>
      </div>
    </div>
  );
}
