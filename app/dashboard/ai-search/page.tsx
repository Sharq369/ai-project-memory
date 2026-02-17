'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, Sparkles, Send, Loader2, Calendar, Folder, Copy, Check, MousePointer2 } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const suggestions = [
    "What was the schema?",
    "Summarize recent notes",
    "UI design memories"
  ]

  const handleSearch = async (overrideQuery?: string) => {
    const searchTerm = overrideQuery || query
    if (!searchTerm.trim() || isSearching) return

    setQuery(searchTerm)
    setIsSearching(true)
    setHasSearched(true)

    const { data, error } = await supabase
      .from('memories')
      .select(`*, projects ( name )`)
      .ilike('content', `%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (!error) setResults(data || [])
    setIsSearching(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2.5 bg-blue-600/10 rounded-xl mb-4 border border-blue-500/20">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Neural Context Search</h1>
          <p className="text-sm text-gray-500">Query your project history with AI precision.</p>
        </div>

        {/* Search Input - Professional Design */}
        <div className="relative mb-6">
          <div className="flex items-center bg-[#16181e] rounded-2xl border border-gray-800 p-2 shadow-2xl focus-within:border-blue-500/50 transition-all">
            <div className="pl-4 text-gray-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-white placeholder:text-gray-600"
              placeholder="Search memories or projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={() => handleSearch()}
              className="h-11 w-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-blue-900/20"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="text-[11px] font-medium bg-[#1e212b] border border-gray-800 px-3 py-1.5 rounded-full hover:border-blue-500/40 hover:text-blue-400 transition-all text-gray-500"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {!isSearching && hasSearched && results.length === 0 && (
            <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl bg-[#16181e]/30">
              <div className="mb-4 inline-block p-4 bg-gray-800/30 rounded-full">
                <MousePointer2 className="text-gray-600" size={24} />
              </div>
              <p className="text-gray-500 text-sm">No signals found for "{query}"</p>
            </div>
          )}

          {results.map((item) => (
            <div key={item.id} className="bg-[#16181e] p-6 rounded-2xl border border-gray-800 hover:border-blue-500/20 transition-all group shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-400/5 px-2 py-1 rounded border border-blue-400/10 uppercase tracking-tighter">
                    {item.tag || 'Observation'}
                  </span>
                  {item.projects?.name && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10 flex items-center gap-1 uppercase tracking-tighter">
                      <Folder size={10} /> {item.projects.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-mono">
                  <Calendar size={12} />
                  {new Date(item.created_at).toLocaleDateString().toUpperCase()}
                </div>
              </div>

              <p className="text-gray-200 text-base leading-relaxed mb-6">
                {item.content}
              </p>

              <div className="flex justify-end border-t border-gray-800/50 pt-4">
                <button 
                  onClick={() => copyToClipboard(item.content, item.id)}
                  className="flex items-center gap-2 text-[10px] font-bold text-gray-600 hover:text-white uppercase transition-colors"
                >
                  {copiedId === item.id ? (
                    <><Check size={12} className="text-green-500" /> Copied</>
                  ) : (
                    <><Copy size={12} /> Copy Context</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
