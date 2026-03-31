'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Sparkles, Send, BrainCircuit, History, Loader2, Globe, Folder, Database, ExternalLink } from 'lucide-react';

export default function AISearchPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [supabase]);

  const suggestions = [
    "What was the schema for the database?",
    "Summarize my recent project notes",
    "How do I center a div using TailwindCSS?"
  ];

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim() || !userId) return;
    
    setQuery(searchQuery);
    setIsSearching(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, userId })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch intelligence.");
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper to format Gemini's markdown response
  const formatMarkdown = (text: string) => {
    return text.split(/(```[\s\S]*?```)/g).map((segment, index) => {
      if (segment.startsWith('```') && segment.endsWith('```')) {
        const code = segment.slice(3, -3).replace(/^[a-z]+\n/, ''); // strips language tag
        return (
          <div key={index} className="my-4 rounded-xl border border-gray-800 bg-[#050505] overflow-hidden shadow-lg">
            <div className="px-4 py-2 bg-[#111] border-b border-gray-800 flex gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <pre className="p-4 text-sm font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }
      return (
        <p key={index} className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
          {segment.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Sparkles className="text-blue-500" />
          Neural Intelligence
        </h1>
        <p className="text-gray-400 text-lg">Query your codebase, memories, and the live web simultaneously.</p>
      </div>

      {/* Search Input Box */}
      <div className="relative group z-20">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
        <div className="relative flex items-center bg-[#121212] border border-white/10 rounded-xl p-2 shadow-2xl">
          <div className="pl-4 text-gray-500">
            <BrainCircuit size={20} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ask your external brain..."
            className="flex-1 bg-transparent border-none px-4 py-3 text-white focus:outline-none text-lg"
          />
          <button 
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-800 p-3 rounded-lg text-white transition-all shadow-lg"
          >
            {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>

      {/* Default State: Suggestions */}
      {!result && !isSearching && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-500">
          {suggestions.map((text, i) => (
            <button 
              key={i}
              onClick={() => handleSearch(text)}
              className="p-4 bg-white/5 border border-white/10 rounded-xl text-left text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-start gap-3"
            >
              <History size={16} className="mt-0.5 shrink-0 text-blue-500" />
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
          <p>System Error: {error}</p>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <BrainCircuit size={24} className="text-blue-500 animate-pulse" />
          </div>
          <div className="text-sm font-mono text-gray-500 uppercase tracking-widest flex flex-col items-center gap-1">
            <span>Scanning Vault...</span>
            <span>Querying Live Web...</span>
            <span>Synthesizing...</span>
          </div>
        </div>
      )}

      {/* Results State */}
      {result && !isSearching && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          
          {/* Context Sources Chips */}
          <div className="flex flex-wrap gap-2">
             {result.sources.projects.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] uppercase font-bold tracking-widest rounded-full">
                  <Folder size={12} /> {result.sources.projects.length} Nodes Accessed
                </div>
             )}
             {result.sources.memories.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] uppercase font-bold tracking-widest rounded-full">
                  <Database size={12} /> {result.sources.memories.length} Memories Accessed
                </div>
             )}
             {result.sources.web.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] uppercase font-bold tracking-widest rounded-full">
                  <Globe size={12} /> Web Context Integrated
                </div>
             )}
          </div>

          {/* Gemini Answer Box */}
          <div className="bg-[#111218] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
             <div dangerouslySetInnerHTML={{ __html: formatMarkdown(result.answer).map(r => r?.props?.children || r).join('') }} />
          </div>

          {/* Web References (Clickable Links) */}
          {result.sources.web.length > 0 && (
            <div className="pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <Globe size={14} /> Web References
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.sources.web.map((site: any, idx: number) => (
                  <a key={idx} href={site.link} target="_blank" rel="noopener noreferrer" className="p-4 bg-[#16181e] border border-gray-800 hover:border-blue-500/50 rounded-xl transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-gray-200 line-clamp-1 group-hover:text-blue-400 transition-colors">{site.title}</h4>
                      <ExternalLink size={14} className="text-gray-600 group-hover:text-blue-400 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{site.snippet}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
