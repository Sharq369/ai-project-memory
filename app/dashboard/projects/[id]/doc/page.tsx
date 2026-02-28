'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, FileText, Loader2, MessageSquare, Send, 
  X, CheckCircle2, Pencil, Github, Gitlab, Cloud, Terminal, Box
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

  const deployPlatforms = ['VERCEL', 'AWS', 'AZURE', 'GCP', 'NETLIFY', 'RAILWAY']

  useEffect(() => {
    const loadData = async () => {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)
      const { data: mems } = await supabase.from('code_memories').select('*').eq('project_id', id).order('file_name', { ascending: true })
      if (mems) setMemories(mems)
      setLoading(false)
    }
    if (id) loadData()
  }, [id])

  const handleSendMessage = async () => {
    if (!query.trim() || isThinking) return; // FIX: Syntax error cleared
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

  if (loading) return <div className="h-screen bg-[#0a0b0e] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex overflow-hidden">
      <div className={`flex-1 p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-white text-[9px] font-black uppercase mb-12 tracking-widest">
          <ChevronLeft size={14} /> BACK TO VAULT
        </button>

        <div className="max-w-5xl mx-auto">
          <header className="bg-[#111319] border border-gray-800/40 p-10 rounded-[2.5rem] flex justify-between items-center mb-10 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
            <div>
              <div className="flex items-center gap-4 mb-5">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">{project?.name}</h1>
                <button onClick={() => alert("Edit Mode Engaged")} className="p-2 bg-blue-600/10 border border-blue-600/20 rounded-lg text-blue-500 hover:bg-blue-600 hover:text-white transition-all">
                  <Pencil size={12} />
                </button>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex gap-4">
                  <Github size={16} className="text-gray-600 hover:text-white cursor-pointer" />
                  <Gitlab size={16} className="text-gray-600 hover:text-orange-500 cursor-pointer" />
                  <Cloud size={16} className="text-gray-600 hover:text-blue-400 cursor-pointer" />
                </div>
                <div className="h-4 w-px bg-gray-800"></div>
                
                {/* CLICKABLE DEPLOYMENT LIST */}
                <div className="flex gap-2">
                  {deployPlatforms.map(p => (
                    <button key={p} onClick={() => alert(`Build Triggered on ${p}`)} className="text-[8px] font-black text-gray-500 bg-white/5 px-3 py-1.5 rounded-md border border-transparent hover:border-blue-600 hover:text-white transition-all">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-6 rounded-[2rem] hover:scale-105 transition-all shadow-xl shadow-blue-900/40">
              <MessageSquare size={28} fill="white" />
            </button>
          </header>

          <div className="space-y-8 pb-32">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] overflow-hidden">
                <div className="flex justify-between items-center p-8 border-b border-gray-800/40 bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <Terminal size={18} className="text-blue-500"/>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{mem.file_name}</h3>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-4 py-2 rounded-lg flex items-center gap-2 border ${mem.is_verified ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}>
                    <Box size={10}/> {mem.is_verified ? 'GROUNDED STATE' : 'AWAITING SYNC'}
                  </span>
                </div>
                <div className="p-8">
                  <pre className="p-8 bg-black/40 rounded-[1.5rem] text-[11px] font-mono text-gray-400 overflow-x-auto border border-gray-800/20"><code>{mem.content}</code></pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHAT SIDEBAR */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-500">NEURAL HUB</h3>
            <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl"><X size={18} className="text-gray-600" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[1.8rem] text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#111319] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="QUERY ARCHIVE..." className="w-full bg-[#111319] border border-gray-800 rounded-2xl py-6 pl-8 pr-16 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600"/>
            <button onClick={handleSendMessage} className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-blue-500"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
