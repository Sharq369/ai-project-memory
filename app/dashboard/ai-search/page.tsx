'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Search, Sparkles, Send, Loader2, Calendar, Folder, 
  Copy, Check, Trash2, Edit3, X, Filter, Save 
} from 'lucide-react'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState('all')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Edit States
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch projects for the filter dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('*').order('name')
      if (data) setProjects(data)
    }
    fetchProjects()
  }, [])

  const handleSearch = async (overrideQuery?: string) => {
    const searchTerm = overrideQuery || query
    if (!searchTerm.trim() && selectedProject === 'all') return

    setIsSearching(true)
    setHasSearched(true)

    let queryBuilder = supabase
      .from('memories')
      .select('*, projects(name)')
      .order('created_at', { ascending: false })

    if (searchTerm.trim()) {
      queryBuilder = queryBuilder.ilike('content', `%${searchTerm}%`)
    }
    
    if (selectedProject !== 'all') {
      queryBuilder = queryBuilder.eq('project_id', selectedProject)
    }

    const { data, error } = await queryBuilder
    if (!error) setResults(data || [])
    setIsSearching(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove this memory forever.")) return
    
    const { error } = await supabase.from('memories').delete().eq('id', id)
    if (!error) {
      setResults(results.filter(r => r.id !== id))
    }
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('memories')
      .update({ content: editContent })
      .eq('id', id)

    if (!error) {
      setResults(results.map(r => r.id === id ? { ...r, content: editContent } : r))
      setEditingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 mb-4">
            <Sparkles className="text-blue-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Project Intelligence</h1>
        </div>

        {/* Professional Search & Filter Bar */}
        <div className="bg-[#16181e] rounded-2xl border border-gray-800 p-2 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 gap-3">
              <Search size={18} className="text-gray-500" />
              <input
                className="flex-1 bg-transparent py-3 outline-none text-white placeholder:text-gray-600"
                placeholder="Search keywords..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="flex items-center gap-2 p-1">
              {/* Project Filter */}
              <div className="relative">
                <select 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="bg-[#1e212b] border border-gray-700 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-400 outline-none appearance-none pr-10 hover:border-gray-600 transition-colors"
                >
                  <option value="all">ALL PROJECTS</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                </select>
                <Filter size={12} className="absolute right-3 top-3.5 text-gray-600 pointer-events-none" />
              </div>

              <button 
                onClick={() => handleSearch()}
                className="bg-blue-600 h-10 w-10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all"
              >
                {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.map((item) => (
            <div key={item.id} className="bg-[#16181e] p-6 rounded-2xl border border-gray-800 hover:border-blue-500/10 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-400/5 px-2 py-1 rounded border border-blue-400/10 uppercase tracking-tighter">
                    {item.tag || 'NOTE'}
                  </span>
                  {item.projects?.name && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10 flex items-center gap-1 uppercase tracking-tighter">
                      <Folder size={10} /> {item.projects.name}
                    </span>
                  )}
                </div>
                
                {/* Actions: Edit & Delete */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingId(item.id); setEditContent(item.content); }}
                    className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {editingId === item.id ? (
                <div className="space-y-3">
                  <textarea 
                    className="w-full bg-[#1e212b] border border-blue-500/30 rounded-xl p-4 text-white outline-none text-sm leading-relaxed"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-[10px] font-bold text-gray-500 px-3 py-2">
                      <X size={12} /> CANCEL
                    </button>
                    <button onClick={() => handleUpdate(item.id)} className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-4 py-2 rounded-lg">
                      <Save size={12} /> SAVE CHANGES
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-200 text-base leading-relaxed">{item.content}</p>
              )}

              <div className="mt-6 pt-4 border-t border-gray-800/50 flex justify-between items-center">
                <div className="text-[10px] text-gray-600 flex items-center gap-1.5 font-mono uppercase">
                  <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString()}
                </div>
                {editingId !== item.id && (
                  <button 
                    onClick={() => { navigator.clipboard.writeText(item.content); setCopiedId(item.id); setTimeout(() => setCopiedId(null), 2000); }}
                    className="text-[10px] font-bold text-gray-600 hover:text-white transition-colors uppercase"
                  >
                    {copiedId === item.id ? 'COPIED' : 'COPY CONTEXT'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
