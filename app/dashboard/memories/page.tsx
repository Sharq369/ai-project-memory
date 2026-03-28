'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Brain, Plus, Loader2, Layers, Trash2, AlertTriangle, Search, Filter, AlignLeft, Pencil, Check, X, Tag, Lock, ArrowRight } from 'lucide-react'

// ------------------------------------------------------------------
// UPGRADE MODAL COMPONENT
// ------------------------------------------------------------------
const UpgradeModal = ({ isOpen, onClose, reason }: { isOpen: boolean, onClose: () => void, reason: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-blue-500/30 bg-[#0e1117] shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-400" />
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Lock size={24} />
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">{reason}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-[#161b22] hover:bg-gray-800 text-gray-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/settings'}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
            >
              Upgrade Plan <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [newTag, setNewTag] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const [memoryToDelete, setMemoryToDelete] = useState<{ id: string, content: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Gatekeeper state
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')

  // Content edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Tag edit state — inline on the label itself
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editTagValue, setEditTagValue] = useState('')
  const tagInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [mRes, pRes] = await Promise.all([
        supabase.from('memories').select(`*, projects(name)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name')
          .eq('user_id', user.id)
      ])
      if (mRes.data) setMemories(mRes.data)
      if (pRes.data) setProjects(pRes.data)
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (editingTagId && tagInputRef.current) tagInputRef.current.focus()
  }, [editingTagId])

  // ── GATEKEEPER ENABLED: ADD MEMORY ─────────────────────────────────
  const handleAddMemory = async () => {
    if (!content) return
    setIsSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // 1. Check Limits
      const enforceRes = await fetch('/api/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'add_memory' })
      });
      const authCheck = await enforceRes.json();

      // 2. Block if needed
      if (!authCheck.allowed) {
        setUpgradeReason(authCheck.reason);
        setShowUpgrade(true);
        setIsSaving(false);
        return;
      }

      // 3. Proceed if allowed
      const { data, error } = await supabase.from('memories').insert([{
        content,
        tag: newTag.trim() || null,
        project_id: selectedProject || null,
        user_id: user.id
      }]).select('*, projects(name)').single()
      
      if (error) throw error
      
      if (data) {
        setMemories(prev => [data, ...prev])
        setContent('')
        setNewTag('')
        setSelectedProject('')
      }
    } catch (error) {
      console.error('Error syncing memory:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartTagEdit = (m: any) => {
    setEditingTagId(m.id)
    setEditTagValue(m.tag || '')
  }

  // Tagging is allowed on all plans, no gatekeeper needed here
  const handleSaveTag = async (id: string) => {
    const trimmed = editTagValue.trim()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('memories')
        .update({ tag: trimmed || null })
        .eq('id', id)
        .eq('user_id', user.id) // ownership check
      if (error) throw error
      setMemories(prev => prev.map(m => m.id === id ? { ...m, tag: trimmed || null } : m))
    } catch (error) {
      console.error('Error updating tag:', error)
    } finally {
      setEditingTagId(null)
      setEditTagValue('')
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') handleSaveTag(id)
    if (e.key === 'Escape') { setEditingTagId(null); setEditTagValue('') }
  }

  const handleStartEdit = (m: any) => {
    setEditingId(m.id)
    setEditContent(m.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  // ── GATEKEEPER ENABLED: EDIT MEMORY ────────────────────────────────
  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return
    setIsSavingEdit(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // 1. Check if user is allowed to edit (Free plan = false)
      const enforceRes = await fetch('/api/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'edit_memory' })
      });
      const authCheck = await enforceRes.json();

      // 2. Block if needed
      if (!authCheck.allowed) {
        setUpgradeReason(authCheck.reason);
        setShowUpgrade(true);
        setIsSavingEdit(false);
        return;
      }

      // 3. Proceed if allowed
      const { error } = await supabase
        .from('memories')
        .update({ content: editContent })
        .eq('id', id)
      
      if (error) throw error
      
      setMemories(prev => prev.map(m => m.id === id ? { ...m, content: editContent } : m))
      setEditingId(null)
      setEditContent('')
    } catch (error) {
      console.error('Error updating memory:', error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const confirmDeleteMemory = async () => {
    if (!memoryToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('memories').delete().eq('id', memoryToDelete.id)
      if (error) throw error
      setMemories(prev => prev.filter(m => m.id !== memoryToDelete.id))
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete memory. Please try again.')
    } finally {
      setIsDeleting(false)
      setMemoryToDelete(null)
    }
  }

  const filteredMemories = memories.filter(m =>
    m.content.toLowerCase().includes(localSearch.toLowerCase()) ||
    m.tag?.toLowerCase().includes(localSearch.toLowerCase()) ||
    m.projects?.name?.toLowerCase().includes(localSearch.toLowerCase())
  )

  const getLabel = (m: any) => m.tag || m.projects?.name || null

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      
      {/* RENDER UPGRADE MODAL */}
      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        reason={upgradeReason} 
      />

      {/* ADD MEMORY BLOCK */}
      <div className="bg-[#16181e] border border-gray-800 rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <Layers className="text-blue-500" size={20} />
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white">Inject Knowledge</h2>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste code snippets, architectures, or system context..."
          className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl p-5 text-sm text-gray-300 outline-none focus:border-blue-500 min-h-[120px] transition-all font-mono"
        />

        {/* Tag input */}
        <div className="flex items-center gap-3 bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
          <Tag size={14} className="text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Label / tag (optional)..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-300 placeholder:text-gray-600"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1 bg-[#0f1117] border border-gray-800 rounded-xl px-5 py-4 text-xs font-bold text-gray-500 outline-none cursor-pointer hover:border-gray-700 transition-colors"
          >
            <option value="">-- Associate with Project (Optional) --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <button onClick={handleAddMemory} disabled={isSaving || !content} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Sync
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex items-center bg-[#16181e] border border-gray-800 rounded-2xl px-4 py-3 gap-3">
        <Search size={16} className="text-gray-500" />
        <input type="text" placeholder="Filter vault memory..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600" />
        <Filter size={16} className="text-gray-600" />
      </div>

      {/* VAULT FEED */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMemories.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-gray-800 rounded-2xl flex flex-col items-center gap-3">
            <AlignLeft size={24} className="opacity-50" />
            Vault is empty or no matches found.
          </div>
        )}

        {filteredMemories.map((m) => {
          const label = getLabel(m)
          return (
            <div key={m.id} className="bg-[#16181e]/50 border border-gray-800/50 p-6 rounded-2xl flex justify-between items-start group hover:bg-[#16181e] transition-all">
              <div className="space-y-3 w-full pr-6">

                {/* LABEL — click to edit inline */}
                {editingTagId === m.id ? (
                  <div className="flex items-center gap-2">
                    <Tag size={11} className="text-blue-400 shrink-0" />
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={editTagValue}
                      onChange={(e) => setEditTagValue(e.target.value)}
                      onKeyDown={(e) => handleTagKeyDown(e, m.id)}
                      onBlur={() => handleSaveTag(m.id)}
                      placeholder="Enter label..."
                      className="bg-transparent border-b border-blue-500 outline-none text-[11px] font-black uppercase tracking-widest text-blue-400 w-40 pb-0.5"
                    />
                    <span className="text-[9px] text-gray-600 font-mono">↵ to save</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartTagEdit(m)}
                    className={`group/tag flex items-center gap-1.5 text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-tighter border transition-all ${
                      label
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-400/50'
                        : 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:border-gray-400/40 hover:text-gray-400'
                    }`}
                    title="Click to edit label"
                  >
                    {label || 'Unassigned'}
                    <Pencil size={8} className="opacity-0 group-hover/tag:opacity-60 transition-opacity" />
                  </button>
                )}

                {editingId === m.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-[#0f1117] border border-blue-500/50 rounded-xl p-4 text-sm text-gray-300 outline-none font-mono min-h-[120px] resize-none transition-all"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(m.id)}
                        disabled={isSavingEdit || !editContent.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                      >
                        {isSavingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0f1117] p-4 rounded-xl border border-gray-800/50 max-h-96 overflow-y-auto custom-scrollbar">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                      {m.content}
                    </p>
                  </div>
                )}
              </div>

              {editingId !== m.id && (
                <div className="flex flex-col items-center gap-2 pt-1 min-w-[30px]">
                  <Brain className="text-gray-700 group-hover:text-blue-500 transition-colors mb-2" size={20} />
                  <button
                    onClick={() => handleStartEdit(m)}
                    className="p-2 text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Edit Content"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setMemoryToDelete({ id: m.id, content: m.content })}
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Purge Sequence"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* DELETE MODAL */}
      {memoryToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-red-900/30 w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6"><AlertTriangle className="text-red-500" size={24} /></div>
              <h2 className="text-xl font-bold text-white mb-2">Purge Sequence?</h2>
              <div className="p-3 bg-black/50 border border-gray-800 rounded-lg mt-4 max-h-24 overflow-hidden relative">
                <p className="text-xs text-gray-500 italic truncate">"{memoryToDelete.content}"</p>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setMemoryToDelete(null)} disabled={isDeleting} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#161b22] text-gray-300 hover:bg-gray-800 transition-colors">Abort</button>
              <button onClick={confirmDeleteMemory} disabled={isDeleting} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
