'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, FileText, Loader2, MessageSquare, Send, 
  Sparkles, X, Hash, CheckCircle2, Github, Settings, Globe 
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

  useEffect(() => {
    const loadNodeData = async () => {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)
      const { data: mems } = await supabase.from('code_memories')
        .select('*')
        .eq('project_id', id)
        .order('file_name', { ascending: true })
      if (mems) setMemories(mems)
      setLoading(false)
    }
    if (id) loadNodeData()
  }, [id])

  const handleTogglePlatform = async () => {
    const platforms = ['Vercel', 'AWS', 'Netlify', 'Railway', 'VPS']
    const currentIdx = platforms.indexOf(project?.preferred_platform || 'Vercel')
    const nextPlatform = platforms[(currentIdx + 1) % platforms.length]
    
    const { error } = await supabase.from('projects')
      .update({ preferred_platform: nextPlatform })
      .eq('id', id)
    
    if (!error) setProject({ ...project, preferred_platform: nextPlatform })
  }

  const handleSealSuccess = async (memId: string) => {
    // This only triggers once the Vibe Coder confirms the deployment is ✅
    const { error } = await supabase.from('code_memories').update({ 
      is_verified: true, 
      sync_status: 'synced',
      deployment_platform: project?.preferred_platform || 'Vercel',
      deployed_at: new Date().toISOString()
    }).eq('id', memId)
    
    if (!error) {
      setMemories(memories.map(m => m.id === memId ? { ...m, is_verified: true, sync_status: 'synced' } : m))
    }
  }

  const handleSendMessage = async () => {
    if (!query.trim() || isThinking) return // FIX: Cleaned line 70
    
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setIsThinking(true)
    
    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        body: JSON.stringify({ query: userMsg.content, projectId: id }) 
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.response || data.error }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Neural Link Disrupted. Check logs." }])
    } finally {
      setIsThinking(false)
    }
  }

  if (loading) return (
    <div className="h-screen bg-[#0f1117] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex overflow-hidden font-sans">
      {/* Main Content Area */}
      <div className={`flex-1 p-6 md:p-12 transition-all duration-500 overflow-y-auto ${chatOpen ? 'mr-[400px]' : ''}`}>
        <button 
          onClick={() => router.push('/dashboard/projects')} 
          className="flex items-center gap-2 text-gray-600 hover:text-white transition-all text-[10px] font-black uppercase mb-12 tracking-widest"
        >
          <ChevronLeft size={14} /> Back to Vault
        </button>

        <div className="max-w-4xl mx-auto">
          <header className="bg-[#16181e] border border-gray-800/50 p-10 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-6 mb-12 shadow-2xl">
            <div>
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">
                {project?.name} <span className="text-blue-500 opacity-50">/</span> MEMORY
              </h1>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="bg-green-500/5 border border-green-500/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-green-500" />
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">
                    {memories.filter(m => m.is_verified).length} Verified Nodes
                  </span>
                </div>
                <button 
                  onClick={handleTogglePlatform}
                  className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all group"
                >
                  <Settings size={12} className="text-gray-400 group-hover:rotate-90 transition-transform" />
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Platform: <span className="text-white">{project?.preferred_platform || 'Vercel'}</span>
                  </span>
                </button>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(!chatOpen)} 
              className="bg-blue-600 p-5 rounded-[2rem] hover:scale-110 active:scale-95 transition-all shadow-xl shadow-blue-900/40 group"
            >
              <MessageSquare size={28} fill="white" className="group-hover:rotate-6 transition-transform" />
            </button>
          </header>

          <div className="space-y-8 pb-32">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#16181e] border border-gray-800/40 rounded-[2.5rem] p-8 md:p-10 hover:border-blue-500/40 transition-all group/card">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <FileText size={20} className="text-blue-500"/>
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight">{mem.file_name}</h3>
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] mt-1">Grounded Source Code</p>
                    </div>
                  </div>
                  
                  {mem.is_verified ? (
                    <div className="flex items-center gap-2 px-5 py-2 bg-green-500/5 border border-green-500/20 rounded-2xl">
                      <CheckCircle2 size={12} className="text-green-500"/>
                      <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Successfully Deployed</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSealSuccess(mem.id)} 
                      className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-all active:scale-95 shadow-lg"
                    >
                      <Github size={14}/> Seal & Document
                    </button>
                  )}
                </div>
                <div className="relative group/code">
                  <pre className="p-8 bg-black/60 rounded-[2rem] text-[11px] font-mono text-gray-400 border border-gray-800/50 overflow-x-auto leading-relaxed scrollbar-hide">
                    <code>{mem.content}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Neural Terminal Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-blue-500 animate-pulse" />
              <h3 className="text-sm font-black uppercase italic tracking-[0.2em]">Neural Hub</h3>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 px-10 grayscale">
                <div className="w-16 h-16 border-2 border-dashed border-blue-500 rounded-full mb-6 animate-spin-slow" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-loose">
                  Standing by. Grounded to {memories.filter(m => m.is_verified).length} verified deployment nodes.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[12px] leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'bg-[#16181e] border border-gray-800 text-gray-300'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-2 p-6 bg-white/5 rounded-[2rem] w-fit">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          <div className="relative pt-4">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="QUERY ARCHIVE..."
              className="w-full bg-[#16181e] border border-gray-800 rounded-2xl py-5 pl-8 pr-16 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            <button 
              onClick={handleSendMessage} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-white hover:scale-110 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
