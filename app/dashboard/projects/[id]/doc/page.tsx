'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, Loader2, MessageSquare, Send, 
  X, Pencil, Github, Gitlab, Cloud, Terminal, Box, Check
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
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')

  const deployTargets = [
    { name: 'VERCEL', status: 'Active' },
    { name: 'AWS', status: 'Ready' },
    { name: 'AZURE', status: 'Idle' },
    { name: 'GCP', status: 'Idle' },
    { name: 'NETLIFY', status: 'Ready' },
    { name: 'RAILWAY', status: 'Idle' }
  ]

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

  // Functional Rename
  const handleRename = async () => {
    if (!editName.trim() || editName === project.name) {
      setIsEditing(false)
      return
    }
    const { error } = await supabase.from('projects').update({ name: editName }).eq('id', id)
    if (!error) {
      setProject({ ...project, name: editName })
    }
    setIsEditing(false)
  }

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
        <button onClick={() => router.push('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-white text-[9px] font-black uppercase mb-12 tracking-widest group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> BACK TO VAULT
        </button>

        <div className="max-w-5xl mx-auto">
          <header className="bg-[#111319] border border-gray-800/40 p-10 rounded-[2.5rem] flex justify-between items-start mb-10 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-8 h-16">
                {isEditing ? (
                  <div className="flex items-center gap-4">
                    <input 
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                      className="bg-black/50 border border-blue-600 rounded-xl px-4 py-2 text-5xl font-black italic uppercase tracking-tighter text-white outline-none w-full max-w-md"
                    />
                    <button onClick={handleRename} className="p-3 bg-blue-600 rounded-lg hover:bg-white hover:text-black transition-all">
                      <Check size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">{project?.name}</h1>
                    <button onClick={() => { setEditName(project.name); setIsEditing(true); }} className="p-2 bg-blue-600/10 border border-blue-600/20 rounded-lg text-blue-500 hover:bg-blue-600 hover:text-white transition-all">
                      <Pencil size={14} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-12">
                <div className="space-y-4">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">Source Protocols</p>
                  <div className="flex gap-4">
                    {/* Fixed GitHub Trigger */}
                    <button onClick={() => alert("Neural Sync Triggered. Awaiting GitHub Webhook...")} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-blue-500 transition-all">
                      <Github size={20} />
                    </button>
                    <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-orange-500 transition-all">
                      <Gitlab size={20} />
                    </button>
                    <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 hover:text-blue-400 transition-all">
                      <Cloud size={20} />
                    </button>
                  </div>
                </div>

                <div className="w-px h-16 bg-gray-800 mt-4"></div>

                <div className="flex-1">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Deployment Manifest</p>
                  <div className="grid grid-cols-3 gap-2">
                    {deployTargets.map((target) => (
                      <button key={target.name} className="flex items-center justify-between px-4 py-2 bg-black/40 border border-gray-800/40 rounded-lg hover:border-blue-600/50 hover:bg-blue-600/5 transition-all group">
                        <span className="text-[9px] font-black text-gray-400 group-hover:text-white">{target.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${target.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setChatOpen(!chatOpen)} className="bg-blue-600 p-7 rounded-[2.2rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-900/40 ml-8">
              <MessageSquare size={32} fill="white" stroke="none" />
            </button>
          </header>

          <div className="space-y-8 pb-32">
             {/* Render Memories here exactly as before */}
            {memories.map((mem) => (
              <div key={mem.id} className="bg-[#111319] border border-gray-800/40 rounded-[2.5rem] overflow-hidden group hover:border-blue-600/20 transition-all">
                <div className="flex justify-between items-center p-8 border-b border-gray-800/40 bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    <Terminal size={18} className="text-blue-500"/>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{mem.file_name}</h3>
                      <p className="text-[7px] text-gray-600 font-bold uppercase mt-1">Status: Verified</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-2">
                    <Box size={10}/> GROUNDED STATE
                  </span>
                </div>
                <div className="p-8">
                  <pre className="p-8 bg-black/60 rounded-[1.5rem] text-[11px] font-mono text-gray-400 overflow-x-auto border border-gray-800/20 scrollbar-hide">
                    <code>{mem.content}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHAT SIDEBAR REMAINS UNCHANGED */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-[#0d0f14] border-l border-gray-800/50 shadow-2xl transition-transform duration-500 z-50 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
               <div className="w-2 h-2 bg-blue-600 rounded-full"></div> NEURAL HUB
            </h3>
            <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X size={18} className="text-gray-600" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[1.8rem] text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#111319] border border-gray-800 text-gray-300'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="QUERY ARCHIVE..." 
              className="w-full bg-[#111319] border border-gray-800 rounded-2xl py-6 pl-8 pr-16 text-[10px] font-black uppercase text-white outline-none focus:border-blue-600 transition-all"
            />
            <button onClick={handleSendMessage} className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-white transition-colors">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
