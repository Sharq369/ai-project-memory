'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, FileText, Loader2, MessageSquare, Send, 
  Sparkles, X, CheckCircle2, Github, Settings, Globe 
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

  const handleTogglePlatform = async () => {
    const platforms = ['Vercel', 'AWS', 'Netlify', 'Railway', 'VPS']
    const currentIdx = platforms.indexOf(project?.preferred_platform || 'Vercel')
    const nextPlatform = platforms[(currentIdx + 1) % platforms.length]
    const { error } = await supabase.from('projects').update({ preferred_platform: nextPlatform }).eq('id', id)
    if (!error) setProject({ ...project, preferred_platform: nextPlatform })
  }

  const handleSendMessage = async () => {
    if (!query.trim() || isThinking) return // FIX: Removed the stray colon
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
      <div className={`flex-1 p-8 md:p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-white transition-all text-[10px] font-black uppercase mb-12 tracking-widest">
          <ChevronLeft size={14} /> Back to Vault
        </button>

        <div className="max-w-4xl mx-auto">
          <header className="bg-[#16181e] border border-gray-800/50 p-10 rounded-[3rem] flex justify-between items-center mb-12 shadow-2xl">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{project?.name}</h1>
              <div className="flex gap-4 items-center">
                <button onClick={handleTogglePlatform} className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all group">
                  <Settings size={12} className="text-gray-400 group-hover:rotate-90 transition-transform" />
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Platform: <span className="text-white">{project?.preferred_platform || 'Vercel'}</span></span>
                </button>
              </div>
            </div>
            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-5 rounded-[2rem] hover:scale-110 active:scale-95 transition-all shadow-xl shadow-blue-900/40">
              <MessageSquare size={28} fill="white" />
            </button>
          </header>

          <div className="space-y-8 pb-32">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#16181e] border border-gray-800/40 rounded-[2.5rem] p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <FileText size={20} className="text-blue-500"/>
                    <h3 className="text-xl font-black italic uppercase tracking-tight">{mem.file_name}</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[8px] font-black uppercase px-3 py-1 border rounded-full flex items-center gap-1.5 ${mem.is_verified ? 'text-green-500 bg-green-500/5 border-green-500/20' : 'text-gray-500 bg-gray-500/5 border-gray-500/20'}`}>
                      <CheckCircle2 size={10}/> {mem.is_verified ? 'Grounded State' : 'Unverified'}
                    </span>
                    {mem.deployed_at && <p className="text-[7px] text-gray-600 uppercase mt-1 tracking-tighter">Last Synced: {new Date(mem.deployed_at).toLocaleTimeString()}</p>}
                  </div>
                </div>
                <pre className="p-8 bg-black/60 rounded-[2rem] text-[11px] font-mono text-gray-400 border border-gray-800/50 overflow-x-auto leading-relaxed"><code>{mem.content}</code></pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Neural Hub Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-sm font-black uppercase italic tracking-[0.2em]">Neural Hub</h3>
            <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl"><X size={20} className="text-gray-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#16181e] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="relative pt-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="QUERY ARCHIVE..." className="w-full bg-[#16181e] border border-gray-800 rounded-2xl py-5 pl-8 pr-16 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500 transition-all"/>
            <button onClick={handleSendMessage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-white"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
