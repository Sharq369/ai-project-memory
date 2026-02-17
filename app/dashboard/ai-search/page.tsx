'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, Sparkles, Send, Loader2, Calendar, Folder, Copy, Check } from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setHasSearched(true)

    // 1. Fetch memories AND the related project name
    const { data, error } = await supabase
      .from('memories')
      .select(`
        *,
        projects ( name )
      `)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      // Fallback: If the 'projects' relation fails, just fetch memories
      const { data: fallbackData } = await supabase
        .from('memories')
        .select('*')
        .ilike('content', `%${query}%`)
      setResults(fallbackData || [])
    } else {
      setResults(data || [])
    }
    
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
        
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-2xl mb-4 border border-blue-500/20">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Neural Search</h1>
          <p className="text-gray-500">Retrieve context from your project history.</p>
        </div>

        {/* Search Input Area */}
        <div className="relative mb-12 group z-10">
          {/* Glowing effect behind the search bar */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          
          <div className="relative flex items-center bg-[#16181e] rounded-2xl border border-gray-800 p-2 shadow-2xl">
            <div className="pl-4 text-gray-500">
              <Search size={20} />
            </div>
            
            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none py-4 px-4 text-white text-lg placeholder:text-gray-600"
              placeholder="Search specific keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            <button 
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="h-12 w-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="space-y-4">
          
          {/* Empty State */}
          {!isSearching && hasSearched && results.length === 0 && (
            <div className="text-center py-16 border border-dashed border-gray-800 rounded-3xl bg-[#16181e]/50">
              <p className="text-gray-500">No signals found for "{query}"</p>
            </div>
          )}

          {/* Results List */}
          {results.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-[#16181e] p-6 rounded-2xl border border-gray-800/60 hover:border-blue-500/30 transition-all group/card animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card Header: Tag & Project */}
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-500/20 uppercase tracking-wider">
                    {item.tag || 'NOTE'}
                  </span>
                  
                  {/* Shows Project Name if it exists */}
                  {item.projects?.name && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                      <Folder size={10} /> {item.projects.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Calendar size={12} />
                  {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>

              {/* Card Content */}
              <p className="text-gray-200 text-base leading-relaxed mb-4">
                {item.content}
              </p>

              {/* Card Footer: Copy Action */}
              <div className="flex justify-end pt-4 border-t border-gray-800/50">
                <button 
                  onClick={() => copyToClipboard(item.content, item.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-white transition-colors"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check size={14} className="text-green-500" />
                      <span className="text-green-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Text</span>
                    </>
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
