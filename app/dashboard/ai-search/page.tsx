'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Search, Sparkles, Send, Loader2, Calendar, Folder, 
  Copy, Check, Trash2, Edit3, X, Filter, Save, AlertTriangle, CheckCircle2, AlertCircle, Info
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

  // Premium UI States
  const [notification, setNotification] = useState<{ visible: boolean, type: 'success' | 'error' | 'info', message: string }>({ visible: false, type: 'info', message: '' })
  const [memoryToDelete, setMemoryToDelete] = useState<{ id: string, content: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ visible: true, type, message })
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 4000)
  }

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

    // Note: Currently performing standard keyword search. 
    // Next step: Upgrade to pgvector semantic search.
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
    if (!error) {
      setResults(data || [])
      if (data?.length === 0) showToast('info', 'No matching context found.')
    } else {
      showToast('error', 'Search failed. Please try again.')
    }
    setIsSearching(false)
  }

  const confirmDelete = async () => {
    if (!memoryToDelete) return
    setIsDeleting(true)
    
    const { error } = await supabase.from('memories').delete().eq('id', memoryToDelete.id)
    if (!error) {
      setResults(results.filter(r => r.id !== memoryToDelete.id))
      showToast('success', 'Context memory permanently purged.')
    } else {
      showToast('error', `Failed to delete: ${error.message}`)
    }
    
    setIsDeleting(false)
    setMemoryToDelete(null)
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('memories')
      .update({ content: editContent })
      .eq('id', id)

    if (!error) {
      setResults(results.map(r => r.id === id ? { ...r, content: editContent } : r))
      setEditingId(null)
      showToast('success', 'Memory updated successfully.')
    } else {
      showToast('error', 'Failed to update memory.')
    }
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    showToast('success', 'Context copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-4 md:p-8 relative">
      
      {/* PREMIUM TOAST NOTIFICATION */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 pointer-events-none
        ${notification.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}
      >
        <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-md pointer-events-auto
          ${notification.type === 'success' ? 'bg-green-950/80 border-green-500/30 text-green-200' :
            notification.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-200' :
            'bg-blue-950/80 border-blue-500/30 text-blue-200'}`}
        >
          {notification.type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
          {notification.type === 'error' && <AlertCircle size={16} className="text-red-500" />}
          {notification.type === 'info' && <Info size={16} className="text-blue-500" />}
          
          <span className="text-sm font-medium">{notification.message}</span>
          
          <button onClick={() => setNotification(prev => ({...prev, visible: false}))} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      </div>

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
                    className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors bg-[#0f1117] rounded-md border border-gray-800"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => setMemoryToDelete({ id: item.id, content: item.content })}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors bg-[#0f1117] rounded-md border border-gray-800"
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
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-[10px] font-bold text-gray-500 px-3 py-2 hover:text-white transition-colors">
                      <X size={12} /> CANCEL
                    </button>
                    <button onClick={() => handleUpdate(item.id)} className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors">
                      <Save size={12} /> SAVE CHANGES
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
              )}

              <div className="mt-6 pt-4 border-t border-gray-800/50 flex justify-between items-center">
                <div className="text-[10px] text-gray-600 flex items-center gap-1.5 font-mono uppercase">
                  <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString()}
                </div>
                {editingId !== item.id && (
                  <button 
                    onClick={() => handleCopy(item.content, item.id)}
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase bg-[#0f1117] px-3 py-1.5 rounded-lg border border-gray-800"
                  >
                    {copiedId === item.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {copiedId === item.id ? 'COPIED' : 'COPY CONTEXT'}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {hasSearched && !isSearching && results.length === 0 && (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl bg-[#16181e]/50">
              <Search className="mx-auto text-gray-600 mb-4" size={32} />
              <h3 className="text-white font-medium mb-1">No intelligence found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your keywords or project filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* PREMIUM CUSTOM CONFIRMATION MODAL */}
      {memoryToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="bg-[#0e1117] border border-red-900/30 w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl scale-in-95">
            <div className="p-6 md:p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Intelligence?</h2>
              <p className="text-sm text-gray-400 mb-4">
                You are about to permanently delete this memory block. This cannot be undone.
              </p>
              <div className="p-3 bg-black/50 border border-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 truncate italic">"{memoryToDelete.content}"</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 md:px-8 pb-6 md:pb-8">
              <button 
                onClick={() => setMemoryToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#161b22] hover:bg-gray-800 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
