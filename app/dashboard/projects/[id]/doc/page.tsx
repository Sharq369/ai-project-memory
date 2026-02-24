'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ChevronLeft, FileText, Loader2, MessageSquare, Send, Sparkles, X, Hash } from 'lucide-react'

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

  const scrollToBlock = (fileName: string) => {
    const element = document.getElementById(`block-${fileName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'ring-offset-[#0f1117]');
      setTimeout(() => element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-4', 'ring-offset-[#0f1117]'), 3000);
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[\[.*?\]\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const fileName = part.slice(2, -2);
        return (
          <button
            key={index}
            onClick={() => scrollToBlock(fileName)}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-500 hover:text-white transition-all italic font-bold"
          >
            <Hash size={10} /> {fileName}
          </button>
        );
      }
      return part;
    });
  };

  const handleSendMessage = async () => {
    if (!query || isThinking) return
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setIsThinking(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, projectId: id })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.response || data.error }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Neural Link Disrupted. Check API route." }])
    } finally {
      setIsThinking(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f1117]"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex overflow-hidden">
      {/* Main Content Area */}
      <div className={`flex-1 p-8 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-[10px] font-black uppercase mb-12">
          <ChevronLeft size={14} /> Back to Vault
        </button>

        <div className="max-w-4xl mx-auto space-y-12">
          <div className="bg-[#16181e] border border-gray-800 p-10 rounded-[2.5rem] flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">{project?.name}</h1>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Node Active: {memories.length} Blocks</p>
            </div>
            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-4 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-blue-900/40">
              <MessageSquare size={24} fill="white" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 pb-32">
            {memories.map((mem) => (
              <div 
                key={mem.id} 
                id={`block-${mem.file_name}`}
                className="bg-[#16181e] border border-gray-800 rounded-[2rem] overflow-hidden transition-all duration-500"
              >
                <div className="bg-gray-900/50 px-8 py-4 border-b border-gray-800 flex items-center gap-3">
                  <FileText size={14} className="text-blue-500"/>
                  <span className="text-[11px] font-black uppercase tracking-widest">{mem.file_name}</span>
                </div>
                <pre className="p-8 text-gray-400 text-xs font-mono overflow-x-auto leading-relaxed"><code>{mem.content}</code></pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Neural Terminal Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800 transition-transform duration-500 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" /> Neural Terminal
            </h3>
            <button onClick={() => setChatOpen(false)}><X size={20} className="text-gray-700 hover:text-white" /></button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 scrollbar-hide">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-center opacity-20 px-10">
                <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Strict Mode Active. AI is grounded to local memory blocks.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-5 rounded-3xl text-[11px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#16181e] border border-gray-800 text-gray-300'}`}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isThinking && <Loader2 className="animate-spin text-blue-500 mx-auto" size={16} />}
          </div>

          <div className="relative mt-auto">
            <input 
              value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Query memory blocks..."
              className="w-full bg-[#16181e] border border-gray-800 rounded-2xl py-5 pl-6 pr-14 text-xs text-white outline-none focus:border-blue-500 transition-all"
            />
            <button onClick={handleSendMessage} className="absolute right-4 top-4 p-1 text-blue-500 hover:text-white transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
