'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Database, Plus, Loader2, Trash2, 
  Tag as TagIcon, Calendar, Hash, AlertCircle 
} from 'lucide-react'

export default function MemoriesPage() {
  const [content, setContent] = useState('')
  const [memories, setMemories] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Fetch existing memories
  useEffect(() => {
    fetchMemories()
  }, [])

  async function fetchMemories() {
    const { data } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setMemories(data)
    setLoading(false)
  }

  // 2. The Auto-Tagger Logic (Professional Keyword Analysis)
  const getAutoTag = (text: string) => {
    const input = text.toLowerCase()
    if (input.includes('api') || input.includes('code') || input.includes('fix')) return 'DEVELOPMENT'
    if (input.includes('ui') || input.includes('design') || input.includes('color')) return 'DESIGN'
    if (input.includes('saas') || input.includes('market') || input.includes('plan')) return 'BUSINESS'
    return 'OBSERVATION'
  }

  // 3. Professional Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSaving) return

    setIsSaving(true)
    const tag = getAutoTag(content)

    const { data, error } = await supabase
      .from('memories')
      .insert([{ content, tag }])
      .select()

    if (!error && data) {
      setMemories([data[0], ...memories])
      setContent('')
    }
    setIsSaving(false)
  }

  const deleteMemory = async (id: string) => {
    const { error } = await supabase.from('memories').delete().eq('id', id)
    if (!error) setMemories(memories.filter(m => m.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* Input Section */}
      <section className="bg-[#16181e] border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <Database className="text-blue-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Record Memory</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <textarea
            className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl p-5 text-gray-200 outline-none focus:border-blue-500/50 transition-all min-h-[120px] resize-none text-lg"
            placeholder="What's on your mind? AI will auto-categorize your entry..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={12} /> Auto-tagging active
            </p>
            <button
              disabled={isSaving || !content.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              SAVE ENTRY
            </button>
          </div>
        </form>
      </section>

      {/* List Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] px-2">Recent Archives</h3>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-700" /></div>
        ) : (
          <div className="grid gap-4">
            {memories.map((m) => (
              <div key={m.id} className="group bg-[#16181e] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition-all flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded border border-blue-500/20 flex items-center gap-1.5">
                      <Hash size={10} /> {m.tag}
                    </span>
                    <span className="text-[10px] text-gray-600 flex items-center gap-1.5 font-medium uppercase">
                      <Calendar size={12} /> {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{m.content}</p>
                </div>
                <button 
                  onClick={() => deleteMemory(m.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-700 hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
