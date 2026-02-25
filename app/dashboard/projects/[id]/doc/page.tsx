'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ChevronLeft, 
  FileText, 
  Loader2, 
  Send, 
  Sparkles, 
  X, 
  Terminal,
  Cpu,
  Zap,
  Code2,
  Copy,
  Check,
  Search,
  Activity,
  BarChart3
} from 'lucide-react'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectDocPage() {
  const { id } = useParams()
  const router = useRouter()
  
  // State Management
  const [project, setProject] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [heatmapOpen, setHeatmapOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // AI Chat State
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: 'Neural link established. Heatmap data and memory blocks are synchronized. How shall we proceed?' }
  ])
  const [isThinking, setIsThinking] = useState(false)

  useEffect(() => {
    if (id) loadNodeData()
  }, [id])

  const loadNodeData = async () => {
    setLoading(true)
    try {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)

      const { data: mems } = await supabase.from('code_memories')
        .select('*')
        .eq('project_id', id)
        .order('file_name', { ascending: true })
      
      if (mems) setMemories(mems)
    } catch (err) {
      console.error("Critical Sync Error:", err)
    } finally {
      setLoading(false)
    }
  }

  // HEATMAP LOGIC: Calculate complexity based on character count
  const heatmapData = useMemo(() => {
    if (memories.length === 0) return []
    const maxLen = Math.max(...memories.map(m => m.content?.length || 0))
    return memories.map(m => ({
      ...m,
      intensity: maxLen > 0 ? ((m.content?.length || 0) / maxLen) : 0
    }))
  }, [memories])

  const handleSendMessage = async () => {
    if (!query.trim()) return
    const userMsg = query
    setQuery('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsThinking(true)

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: `Analysis of the heatmap suggests high complexity in the "${heatmapData[0]?.file_name || 'core'}" blocks. Based on your query "${userMsg}", I recommend optimizing the logic handling in those high-intensity sectors.` 
      }])
      setIsThinking(false)
    }, 1200)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredMemories = memories.filter(m => 
    m.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-500" size={64} strokeWidth={1} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="text-blue-400 animate-pulse" size={24} />
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.8em] text-blue-500 animate-pulse">Calculating Heatmap...</span>
      </div>
    )
  }

  return (
    <div className="relative max-w-7xl mx-auto p-4 md:p-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => router.push('/dashboard/projects')}
            className="p-5 bg-[#111319] border border-gray-800 rounded-[1.5rem] text-gray-500 hover:text-white hover:border-blue-500/50 transition-all group"
          >
            <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none mb-4">
              {project?.name || 'Project Node'}
            </h1>
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setHeatmapOpen(!heatmapOpen)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-[9px] font-black uppercase tracking-widest ${heatmapOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-gray-800 text-gray-500 hover:text-blue-500'}`}
               >
                 <BarChart3 size={14} /> {heatmapOpen ? 'Hide Heatmap' : 'Show Heatmap'}
               </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input 
                    type="text" 
                    placeholder="Search memory..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#111319] border border-gray-800 rounded-xl py-4 pl-12 pr-6 text-[10px] text-white font-bold uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all w-64"
                />
            </div>
            <button 
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-4 bg-blue-600 px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-blue-500 shadow-2xl shadow-blue-900/40 transition-all active:scale-95"
            >
                <Sparkles size={20} />
                Neural Chat
            </button>
        </div>
      </div>

      {/* NEURAL HEATMAP VISUALIZER */}
      {heatmapOpen && (
        <div className="mb-12 animate-in fade-in zoom-in duration-500">
           <div className="bg-[#111319] border border-gray-800 rounded-[3rem] p-10 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Activity size={20} /></div>
                      <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Neural Complexity Heatmap</h3>
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em]">Normalized by Byte Intensity</p>
              </div>

              <div className="flex flex-wrap gap-3">
                 {heatmapData.map((node, i) => (
                    <div 
                      key={i} 
                      title={`${node.file_name} (${node.content?.length} bytes)`}
                      onClick={() => setSelectedFile(node)}
                      className="group relative cursor-pointer"
                    >
                        <div 
                          className="w-10 h-10 md:w-14 md:h-14 rounded-xl border border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:z-10"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${Math.max(0.05, node.intensity)})`,
                            borderColor: `rgba(59, 130, 246, ${node.intensity * 0.8})`
                          }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20">
                           <div className="bg-black border border-gray-800 px-3 py-2 rounded-lg whitespace-nowrap">
                              <p className="text-[8px] font-black text-white uppercase tracking-tighter">{node.file_name}</p>
                              <p className="text-[7px] text-blue-500 font-bold uppercase">{Math.round(node.intensity * 100)}% Complexity</p>
                           </div>
                        </div>
                    </div>
                 ))}
              </div>
              <div className="mt-8 pt-8 border-t border-gray-800/50 flex items-center justify-between text-[8px] font-bold text-gray-700 uppercase tracking-widest">
                 <span>Low Intensity</span>
                 <div className="flex-1 mx-4 h-1 bg-gradient-to-r from-blue-500/5 via-blue-500/40 to-blue-500 rounded-full" />
                 <span>High Intensity</span>
              </div>
           </div>
        </div>
      )}

      {/* MEMORY BLOCKS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMemories.map((mem) => (
          <div key={mem.id} className="bg-[#111319] border border-gray-800/40 rounded-[3rem] p-10 hover:border-blue-500/40 transition-all group relative flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                <FileText className="text-blue-500" size={24} />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">
                  {mem.file_name}
                </h3>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Memory Block</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-10 line-clamp-4 flex-1">
              {mem.description || 'Neural analysis complete. This block contains documented logic and functional exports for this specific project node.'}
            </p>

            <button 
              onClick={() => setSelectedFile(mem)}
              className="w-full py-5 bg-transparent border border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-blue-500 hover:bg-white/5 transition-all mt-auto"
            >
              Access Source
            </button>
          </div>
        ))}
      </div>

      {/* SOURCE TERMINAL MODAL */}
      {selectedFile && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setSelectedFile(null)} />
          <div className="relative w-full max-w-5xl h-[85vh] bg-[#0a0c10] border border-gray-800 rounded-[3rem] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
            <div className="p-8 border-b border-gray-800 flex items-center justify-between bg-[#111319]">
              <div className="flex items-center gap-6">
                <div className="p-3 bg-blue-600 rounded-xl"><Terminal size={20} className="text-white" /></div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">{selectedFile.file_name}</h2>
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-1">Source Protocol Mode</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => copyToClipboard(selectedFile.content)}
                  className="flex items-center gap-3 px-6 py-4 bg-gray-800/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all border border-gray-800"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
                <button onClick={() => setSelectedFile(null)} className="p-4 bg-gray-800/30 rounded-2xl text-gray-400 hover:text-white transition-all border border-gray-800">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-12 font-mono text-[13px] leading-relaxed text-blue-100/70">
              <pre className="whitespace-pre-wrap">{selectedFile.content || '// System Alert: No content detected.'}</pre>
            </div>
          </div>
        </div>
      )}

      {/* AI CHAT SIDEBAR */}
      {chatOpen && (
        <div className="fixed inset-0 z-[130] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#0f1116] border-l border-gray-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="p-10 border-b border-gray-800 flex items-center justify-between bg-[#111319]">
              <div className="flex items-center gap-5">
                <Sparkles size={28} className="text-blue-500" />
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Neural Hub</h2>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-white p-2 transition-colors"><X size={32} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-7 rounded-[2rem] text-[12px] font-medium leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/30' 
                    : 'bg-[#16181e] border border-gray-800 text-gray-300 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-center gap-4 text-blue-500 px-4 animate-pulse">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em]">Decoding Logic...</span>
                </div>
              )}
            </div>
            <div className="p-10 border-t border-gray-800 bg-[#111319]">
              <div className="relative">
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="QUERY PROJECT MEMORY..."
                  className="w-full bg-[#0a0c10] border border-gray-800 rounded-2xl py-7 pl-8 pr-20 text-[11px] text-white outline-none focus:border-blue-500 transition-all placeholder:text-gray-800 font-bold uppercase tracking-widest"
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-blue-500 hover:text-white transition-all bg-blue-500/10 rounded-xl"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
