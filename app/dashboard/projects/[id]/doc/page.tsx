'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, FileText, Loader2, MessageSquare, Send, 
  X, CheckCircle2, Pencil, Github, Gitlab, Cloud, Settings
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

  // FIX: This function caused your build error. The syntax is now perfect.
  const handleSendMessage = async () => {
    if (!query.trim() || isThinking) return; // Fixed the colon error here
    
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery(''); 
    setIsThinking(true)
    
    try {
      const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ query: userMsg.content, projectId: id }) })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.response || data.error }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Neural Link Disrupted." }])
    } finally { 
      setIsThinking(false) 
    }
  }

  if (loading) return <div className="h-screen bg-[#0a0b0e] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex overflow-hidden font-sans">
      <div className={`flex-1 p-6 md:p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        
        {/* TOP NAVIGATION */}
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-[9px] font-black uppercase mb-10 tracking-widest">
          <ChevronLeft size={14} /> BACK TO VAULT
        </button>

        <div className="max-w-4xl mx-auto">
          
          {/* HEADER MATCHING YOUR SCREENSHOT WITH RESTORED ICONS */}
          <header className="bg-[#111319] border border-gray-800/40 p-8 rounded-[2rem] flex justify-between items-center mb-10">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">{project?.name}</h1>
                <button className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Pencil size={14} /> {/* RESTORED PENCIL ICON */}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <CheckCircle2 size={12}/> VERIFIED BLOCKS: {memories.filter(m => m.is_verified).length}
                </p>
                <div className="w-px h-3 bg-gray-800"></div>
                
                {/* RESTORED PLATFORM TOGGLES */}
                <div className="flex gap-2">
                  <button className="text-gray-500 hover:text-white transition-colors" title="GitHub"><Github size={14}/></button>
                  <button className="text-gray-500 hover:text-orange-500 transition-colors" title="GitLab"><Gitlab size={14}/></button>
                  <button className="text-gray-500 hover:text-blue-400 transition-colors" title="Bitbucket"><Cloud size={14}/></button>
                </div>
                <div className="w-px h-3 bg-gray-800"></div>
                <div className="flex gap-2">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">VERCEL</span>
                  <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest border border-gray-800 px-2 py-1 rounded hover:bg-white/5 cursor-pointer">AWS</span>
                </div>
              </div>
            </div>

            {/* FLOATING BLUE CHAT BUTTON FROM YOUR SCREENSHOT */}
            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-4 md:p-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-900/30">
              <MessageSquare size={20} fill="white" />
            </button>
          </header>

          {/* FILE CARDS MATCHING YOUR SCREENSHOT */}
          <div className="space-y-6 pb-32">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#111319] border border-gray-800/40 rounded-[1.5rem] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-800/40">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-500"/>
                    <h3 className="text-[10px] font-black uppercase tracking-widest">{mem.file_name}</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[7px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 border ${mem.is_verified ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}>
                      <CheckCircle2 size={8}/> {mem.is_verified ? 'GROUNDED STATE' : 'UNVERIFIED'}
                    </span>
                    {mem.deployed_at && <p className="text-[6px] text-gray-600 uppercase mt-1.5 tracking-tighter">LAST SYNCED: {new Date(mem.deployed_at).toLocaleTimeString()}</p>}
                  </div>
                </div>
                <div className="p-6">
                  <pre className="p-6 bg-black/40 rounded-xl text-[10px] md:text-[11px] font-mono text-gray-400 overflow-x-auto leading-relaxed"><code>{mem.content}</code></pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEURAL HUB SIDEBAR (CHAT) */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2"><MessageSquare size={14}/> NEURAL CHAT</h3>
            <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><X size={16} className="text-gray-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#111319] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isThinking && <div className="text-[10px] text-gray-500 italic">Processing...</div>}
          </div>
          <div className="relative">
            <input 
              value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="ASK AI..." 
              className="w-full bg-[#111319] border border-gray-800 rounded-xl py-4 pl-4 pr-12 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500 transition-all"
            />
            <button onClick={handleSendMessage} disabled={isThinking} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-white disabled:opacity-50"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
