'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, FileText, Loader2, MessageSquare, Send, 
  Sparkles, X, CheckCircle2, Github, Settings 
} from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  const [memories, setMemories] = useState<any[]>([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [isThinking, setIsThinking] = useState(false)

  useEffect(() => {
    const loadNodeData = async () => {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)
      const { data: mems } = await supabase.from('code_memories').select('*').eq('project_id', id).order('file_name', { ascending: true })
      if (mems) setMemories(mems)
      setLoading(false)
    }
    if (id) loadNodeData()
  }, [id])

  const handleSendMessage = async () => {
    if (!query.trim() || isThinking) return;
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery(''); setIsThinking(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ query: userMsg.content, projectId: id }) })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.response || data.error }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Neural Link Disrupted." }])
    } finally { setIsThinking(false) }
  }

  if (loading) return <div className="h-screen bg-[#0f1117] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex overflow-hidden">
      <div className={`flex-1 p-8 transition-all overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-white transition-all text-[10px] font-black uppercase mb-12 tracking-widest">
          <ChevronLeft size={14} /> Back to Vault
        </button>

        <div className="max-w-4xl mx-auto">
          <header className="bg-[#16181e] border border-gray-800/50 p-10 rounded-[2.5rem] flex justify-between items-center mb-12 shadow-2xl">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{project?.name}</h1>
              <div className="flex gap-4 items-center">
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={12}/> Verified Blocks: {memories.filter(m => m.is_verified).length}
                </p>
              </div>
            </div>
            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-4 rounded-2xl hover:scale-110 transition-all shadow-lg shadow-blue-900/40">
              <MessageSquare size={24} fill="white" />
            </button>
          </header>

          <div className="space-y-6 pb-20">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#16181e] border border-gray-800 rounded-[2rem] p-8 hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-500"/>
                    <span className="text-[11px] font-black uppercase tracking-widest">{mem.file_name}</span>
                  </div>
                  
                  {/* GROUNDED STATE BADGE & SYNC TIMESTAMP */}
                  <div className="flex flex-col items-end">
                    <span className={`text-[8px] font-black uppercase px-3 py-1 border rounded-full flex items-center gap-1.5 ${mem.is_verified ? 'text-green-500 bg-green-500/5 border-green-500/20' : 'text-gray-500 bg-gray-500/5 border-gray-500/20'}`}>
                      <CheckCircle2 size={10}/> {mem.is_verified ? 'Grounded State' : 'Unverified'}
                    </span>
                    {mem.deployed_at && (
                      <p className="text-[7px] text-gray-600 uppercase mt-1 tracking-tighter">
                        Last Synced: {new Date(mem.deployed_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <pre className="p-8 bg-black/40 rounded-2xl text-xs font-mono text-gray-500 border border-gray-800/50 overflow-x-auto"><code>{mem.content}</code></pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Neural Terminal Sidebar Code Here (Unchanged) */}
    </div>
  )
}
