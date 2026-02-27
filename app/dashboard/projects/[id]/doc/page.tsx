'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, FileText, Loader2, MessageSquare, Send, 
  X, CheckCircle2, Pencil, Github, Gitlab, Cloud, Settings, Monitor
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
    const loadData = async () => {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)
      const { data: mems } = await supabase.from('code_memories').select('*').eq('project_id', id).order('file_name', { ascending: true })
      if (mems) setMemories(mems)
      setLoading(false)
    }
    if (id) loadData()
  }, [id])

  // LINE 70 FIX: Syntax error corrected for Vercel
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

  if (loading) return <div className="h-screen bg-[#0a0b0e] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex overflow-hidden">
      <div className={`flex-1 p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-white transition-all text-[9px] font-black uppercase mb-12 tracking-widest">
          <ChevronLeft size={14} /> BACK TO VAULT
        </button>

        <div className="max-w-4xl mx-auto">
          {/* HEADER RESTORED FROM YOUR SCREENSHOT */}
          <header className="bg-[#111319] border border-gray-800/40 p-10 rounded-[2.5rem] flex justify-between items-center mb-10 shadow-xl">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{project?.name}</h1>
                <button onClick={() => alert("Edit Mode Engaged")} className="p-2 bg-white/5 rounded-full text-gray-500 hover:text-white hover:bg-blue-600 transition-all">
                  <Pencil size={14} />
                </button>
              </div>
              
              <div className="flex items-center gap-5">
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <CheckCircle2 size={12}/> VERIFIED BLOCKS: {memories.filter(m => m.is_verified).length}
                </p>
                <div className="w-px h-3 bg-gray-800"></div>
                
                {/* GIT ICONS FROM SCREENSHOT */}
                <div className="flex gap-2.5 items-center">
                  <Github size={14} className="text-gray-600 hover:text-white cursor-pointer transition-colors" />
                  <Gitlab size={14} className="text-gray-600 hover:text-orange-500 cursor-pointer transition-colors" />
                  <Cloud size={14} className="text-gray-600 hover:text-blue-400 cursor-pointer transition-colors" />
                </div>

                <div className="w-px h-3 bg-gray-800"></div>

                {/* PLATFORM BADGES FROM SCREENSHOT */}
                <div className="flex gap-2">
                  <span className="text-[8px] font-black text-gray-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 cursor-pointer hover:border-blue-600">VERCEL</span>
                  <span className="text-[8px] font-black text-gray-600 px-2.5 py-1 rounded-md border border-gray-800 cursor-pointer hover:border-blue-600">AWS</span>
                </div>
              </div>
            </div>

            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-5 rounded-[1.5rem] hover:scale-105 transition-all shadow-lg shadow-blue-900/40">
              <MessageSquare size={24} fill="white" />
            </button>
          </header>

          <div className="space-y-6 pb-32">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#111319] border border-gray-800/40 rounded-[2rem] overflow-hidden">
                <div className="flex justify-between items-center p-8 border-b border-gray-800/40 bg-white/5">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-blue-500"/>
                    <h3 className="text-[10px] font-black uppercase tracking-widest">{mem.file_name}</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${mem.is_verified ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}>
                      <CheckCircle2 size={10}/> {mem.is_verified ? 'GROUNDED STATE' : 'UNVERIFIED'}
                    </span>
                    {mem.deployed_at && <p className="text-[7px] text-gray-600 uppercase mt-2">LAST SYNCED: {new Date(mem.deployed_at).toLocaleTimeString()}</p>}
                  </div>
                </div>
                <div className="p-8">
                  <pre className="p-8 bg-black/40 rounded-[1.5rem] text-[11px] font-mono text-gray-400 overflow-x-auto leading-relaxed border border-gray-800/30"><code>{mem.content}</code></pre>
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
                <div className={`max-w-[85%] p-5 rounded-[1.5rem] text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#111319] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="QUERY ARCHIVE..." className="w-full bg-[#111319] border border-gray-800 rounded-2xl py-5 pl-6 pr-16 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600"/>
            <button onClick={handleSendMessage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-blue-500"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
