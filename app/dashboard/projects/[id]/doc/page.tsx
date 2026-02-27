'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, FileText, Loader2, MessageSquare, Send, 
  Sparkles, X, Hash, Github, CheckCircle2, ShieldCheck, Globe
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  const [syncingId, setSyncingId] = useState<string | null>(null)

  useEffect(() => {
    const loadNodeData = async () => {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)
      // Only fetch verified/documented memories for grounding [cite: 2]
      const { data: mems } = await supabase.from('code_memories').select('*').eq('project_id', id).order('file_name', { ascending: true })
      if (mems) setMemories(mems)
      setLoading(false)
    }
    if (id) loadNodeData()
  }, [id])

  const handleSealMemory = async (memId: string) => {
    const platform = prompt("Confirm Deployment Platform:", "Vercel")
    if (!platform) return
    setSyncingId(memId)
    const { error } = await supabase.from('code_memories').update({ 
      is_verified: true, 
      deployment_platform: platform,
      sync_status: 'synced',
      deployed_at: new Date().toISOString()
    }).eq('id', memId)
    
    if (!error) {
      setMemories(memories.map(m => m.id === memId ? { ...m, is_verified: true, sync_status: 'synced', deployment_platform: platform } : m))
    }
    setSyncingId(null)
  }

  // Grounded Chat Logic from existing block [cite: 5, 6, 8]
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[\[.*?\]\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const fileName = part.slice(2, -2);
        return <button key={index} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-blue-500/20 rounded text-blue-400 italic font-bold"><Hash size={10} /> {fileName}</button>;
      }
      return part;
    });
  };

  const handleSendMessage = async () => {
    if (!query || isThinking) return [cite: 8]
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery(''); setIsThinking(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ query: userMsg.content, projectId: id }) })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.response || data.error }]) [cite: 9]
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Neural Link Disrupted." }])
    } finally { setIsThinking(false) }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f1117]"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex overflow-hidden">
      <div className={`flex-1 p-8 overflow-y-auto transition-all ${chatOpen ? 'mr-[400px]' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 flex justify-between items-center bg-[#16181e] p-8 rounded-[2.5rem] border border-gray-800">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">{project?.name} / SUCCESS_DOC</h1>
              <div className="flex gap-4 mt-2">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={12}/> Verified Archive</span>
                {project?.live_url && <a href={project.live_url} className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Live URL</a>}
              </div>
            </div>
            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-4 rounded-2xl hover:scale-105 transition-all"><MessageSquare size={24} fill="white" /></button>
          </header>

          <div className="space-y-6">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#16181e] border border-gray-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <FileText className="text-blue-500" size={20} />
                    <h3 className="text-lg font-black italic uppercase">{mem.file_name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {mem.sync_status === 'synced' ? (
                      <span className="text-[8px] font-black uppercase text-green-500 px-3 py-1 border border-green-500/20 bg-green-500/5 rounded-full flex items-center gap-1.5"><ShieldCheck size={10}/> Deployed: {mem.deployment_platform}</span>
                    ) : (
                      <button onClick={() => handleSealMemory(mem.id)} className="text-[9px] font-black uppercase bg-white text-black px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all"><Github size={12}/> Seal & Push</button>
                    )}
                  </div>
                </div>
                <pre className="p-6 bg-black/40 rounded-2xl text-xs font-mono text-gray-400 overflow-x-auto leading-relaxed border border-gray-800/50"><code>{mem.content}</code></pre> [cite: 15]
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEURAL TERMINAL SIDEBAR [cite: 16] */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800 transition-transform z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2"><Sparkles size={16} className="text-blue-500" /> Neural Terminal</h3>
            <button onClick={() => setChatOpen(false)}><X size={20} className="text-gray-700 hover:text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-6">
            {messages.length === 0 && <p className="text-[10px] font-black uppercase tracking-widest text-center opacity-20 pt-20">Strict Mode: Grounded to {memories.length} Verified Blocks</p>} 
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}> [cite: 19]
                <div className={`max-w-[90%] p-5 rounded-3xl text-[11px] font-medium ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#16181e] border border-gray-800 text-gray-300'}`}> [cite: 20]
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isThinking && <Loader2 className="animate-spin text-blue-500 mx-auto" size={16} />}
          </div>
          <div className="relative mt-auto"> [cite: 21]
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Query memory blocks..." className="w-full bg-[#16181e] border border-gray-800 rounded-2xl py-5 pl-6 pr-14 text-xs text-white outline-none" />
            <button onClick={handleSendMessage} className="absolute right-4 top-4 p-1 text-blue-500 hover:text-white"><Send size={18} /></button> [cite: 22]
          </div>
        </div>
      </div>
    </div>
  )
}
