y'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ListTree, HardDrive, Cpu, ShieldCheck, 
  FileText, Activity, Menu
} from 'lucide-react'

// ─── NEURAL WEB CLUSTER CANVAS ───────────────────────────────────────────────
type Particle = { x: number; y: number; vx: number; vy: number; radius: number; isCyan: boolean }

const NeuralWebCluster = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []

    const init = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500
      canvas.height = canvas.parentElement?.clientHeight || 200
      particles = []
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          isCyan: Math.random() > 0.4,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, i) => {
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        p.x += p.vx; p.y += p.vy

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        // Updated to Blue/Cyan theme
        ctx.fillStyle = p.isCyan ? '#06b6d4' : '#3b82f6' 
        ctx.shadowBlur = 12
        ctx.shadowColor = ctx.fillStyle
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2)
          if (dist < 60) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            const grad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y)
            grad.addColorStop(0, p.isCyan ? 'rgba(6,182,212,0.6)' : 'rgba(59,130,246,0.6)')
            grad.addColorStop(1, p2.isCyan ? 'rgba(6,182,212,0.6)' : 'rgba(59,130,246,0.6)')
            ctx.strokeStyle = grad
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    init(); animate()
    window.addEventListener('resize', init)
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', init) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

// ─── MAIN DASHBOARD COMPONENT ────────────────────────────────────────────────
export default function OverviewPage() {
  const [stats, setStats] = useState({ memories: 0, projects: 0, files: 0, links: 0 })
  const [topTags, setTopTags] = useState<{ label: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchStats() {
      const [{ count: mCount }, { count: pCount }, { count: fCount }, { data: tagData }] = await Promise.all([
        supabase.from('memories').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('code_memories').select('*', { count: 'exact', head: true }),
        supabase.from('memories').select('tag').not('tag', 'is', null),
      ])
      const m = mCount || 0
      const p = pCount || 0
      const f = fCount || 0
      setStats({ memories: m, projects: p, files: f, links: m * 3 + f })

      if (tagData) {
        const freq: Record<string, number> = {}
        tagData.forEach((row: any) => { if (row.tag) freq[row.tag] = (freq[row.tag] || 0) + 1 })
        setTopTags(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count })))
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  const vaultBars = useMemo(() => 
    Array.from({ length: 85 }, () => {
      const height = Math.random() * 90 + 10
      const isIntense = Math.random() > 0.85
      const isCyan = Math.random() > 0.92
      return { height, isIntense, isCyan }
    }),
  [stats.memories])

  const val = (n: number) => loading ? '—' : n

  return (
    <div className="relative min-h-screen bg-[#020612] text-white p-4 font-sans overflow-x-auto selection:bg-cyan-500/30">
      
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle dot map or grid background vibe */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.15]" />
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(59,130,246,0.15)_0%,_transparent_60%)] blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(6,182,212,0.15)_0%,_transparent_60%)] blur-[100px]" />
      </div>

      <div className="relative z-10 w-[850px] max-w-[1200px] mx-auto flex flex-col gap-4 pb-6">
        
        {/* HEADER */}
        <header className="flex flex-col mb-1 relative pt-2">
          <div className="absolute -left-2 -top-1 w-8 h-8 flex flex-col justify-center items-center cursor-pointer opacity-80 hover:opacity-100 group">
            <Menu size={24} className="text-cyan-400 group-hover:text-cyan-300 transition" />
          </div>
          <div className="pl-10">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-[1.5px] bg-cyan-500/80 shadow-[0_0_5px_#06b6d4]" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-cyan-400">Neural Command</span>
            </div>
            <h1 className="text-[26px] font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              System Overview
            </h1>
            <p className="text-gray-500 text-[9px] uppercase tracking-wider mt-0.5">Real-time diagnostics of your neural vault.</p>
          </div>
        </header>

        {/* ── TOP STAT GRID ── */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1.3fr] gap-3 h-[180px]">
          
          <div className="col-span-3 grid grid-cols-[1fr_1fr_1fr] grid-rows-[1fr_1fr] gap-3 h-full">
            
            {/* Memories */}
            <div className="bg-gradient-to-br from-[#0a1128]/90 to-[#040814]/90 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80" />
              <Brain size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] mb-1.5" />
              <div className="text-[28px] font-black text-white leading-none mb-1">{val(stats.memories)}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Total Memories</div>
            </div>

            {/* Projects */}
            <div className="bg-gradient-to-br from-[#0a1128]/90 to-[#040814]/90 backdrop-blur-md border border-blue-500/20 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80" />
              <Folder size={16} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] mb-1.5" />
              <div className="text-[28px] font-black text-white leading-none mb-1">{val(stats.projects)}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Active Projects</div>
            </div>

            {/* Neural Clusters */}
            <div className="bg-gradient-to-br from-[#0a1128]/90 to-[#040814]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90" />
              <Hexagon size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] mb-1.5" />
              <div className="text-[28px] font-black text-white leading-none mb-1">{val(stats.files)}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Active Projects</div>
            </div>

            {/* Owned Files (Spans 2 columns just like the image) */}
            <div className="col-span-2 bg-gradient-to-br from-[#0a1128]/90 to-[#040814]/90 backdrop-blur-md border border-blue-500/20 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />
              <FileText size={16} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] mb-1.5" />
              <div className="text-[28px] font-black text-white leading-none mb-1">{val(stats.files)}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Owned Files</div>
            </div>

            {/* Neural Links */}
            <div className="bg-gradient-to-br from-[#0a1128]/90 to-[#040814]/90 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(6,182,212,0.08)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
              <Zap size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] mb-1.5" />
              <div className="text-[28px] font-black text-white leading-none mb-1">{val(stats.links)}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Neural Links</div>
            </div>
          </div>

          {/* Top Labels */}
          <div className="h-full bg-gradient-to-b from-[#081024]/90 to-[#030712]/90 backdrop-blur-md border border-cyan-500/10 rounded-xl p-4 flex flex-col relative overflow-hidden">
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Top Labels</div>
            {!loading && topTags.length > 0 ? (
              <div className="flex flex-col gap-2 flex-1 justify-center">
                {topTags.slice(0, 3).map(({ label, count }, i) => (
                  <div key={label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[7px] font-black uppercase tracking-wider text-gray-300">{label}</span>
                      <span className="text-[7px] font-black text-cyan-400">{count}</span>
                    </div>
                    <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.round((count / (topTags[0]?.count || 1)) * 100)}%`,
                        background: i === 0 ? 'linear-gradient(to right,#0284c7,#38bdf8)' : i === 1 ? 'linear-gradient(to right,#0e7490,#06b6d4)' : 'linear-gradient(to right,#1d4ed8,#60a5fa)',
                        boxShadow: i === 0 ? '0 0 6px rgba(56,189,248,0.5)' : 'none'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <div className="opacity-20 mb-3">
                  <Tag size={40} className="text-cyan-400 stroke-[1.5] -rotate-45 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
                </div>
                <div className="text-[9px] font-black text-cyan-400 tracking-[0.15em] uppercase mb-1.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] leading-tight">
                  No tags yet.<br/>Label your memories.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── KNOWLEDGE DENSITY GRAPH ── */}
        <div className="bg-[#050b1a]/80 backdrop-blur-xl border border-cyan-500/10 rounded-xl p-5 relative overflow-visible shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_10px_30px_rgba(0,0,0,0.8)] h-[240px] flex flex-col">
          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-2 opacity-80">
              <Activity size={12} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-300">Knowledge Density</span>
            </div>
            <div className="text-right">
              <div className="text-cyan-400 font-black text-sm flex items-center justify-end gap-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                +12%
              </div>
            </div>
          </div>

          {/* Floating Node Intelligence Panel */}
          <div className="absolute right-[22%] top-8 z-30 w-[190px] bg-[#040e24]/95 border border-cyan-500/30 rounded-lg p-3 shadow-[0_15px_40px_rgba(0,0,0,0.9),_0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md">
            <div className="text-[9px] font-black text-white uppercase tracking-[0.15em] mb-2">NODE INTELLIGENCE</div>
            <div className="space-y-1 text-[7px] uppercase tracking-wider font-bold">
              <div className="text-cyan-300">NODE: OMEGA-PRIME-9X</div>
              <div className="text-gray-400 mt-1.5">ENCRYPTION LEVEL: <span className="text-white">OMEGA</span></div>
              <div className="text-gray-400">SYNAPSE STRENGTH: <span className="text-white">98%</span></div>
              <div className="text-gray-400">DATA THROUGHPUT: <span className="text-white">4.5 TSLS</span></div>
              <div className="text-gray-400">LATENCY: <span className="text-white">0.02 MS</span></div>
              <div className="text-gray-400">SECURE CHANNEL: <span className="text-white">ACTIVE</span></div>
              <div className="text-gray-400">LAST ACCESS: <span className="text-white">0.001S AGO</span></div>
              <div className="text-gray-400">CORE CLUSTER: <span className="text-white">SECTOR 7</span></div>
              <div className="text-gray-400">THREAT LEVEL: <span className="text-cyan-400">NEGLIGIBLE</span></div>
              <div className="text-gray-400 mt-1.5 opacity-80">SYNAPSE ACTIVITY</div>
              <div className="h-4 w-full mt-1">
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <path d="M0,15 Q10,12 20,16 T40,14 T60,18 T80,10 T100,15" fill="none" stroke="#06b6d4" strokeWidth="1.5" filter="drop-shadow(0 0 2px #06b6d4)" />
                </svg>
              </div>
            </div>
          </div>

          {/* SVG Graph */}
          <div className="flex-1 relative w-full mt-2 -mb-2">
            <div className="absolute inset-0 flex flex-col justify-between opacity-10 py-4">
              {[90,70,50,30,10,0].map((v, i) => (
                <div key={i} className="flex items-center w-full">
                  <div className="border-b border-white border-dashed w-full h-0"></div>
                </div>
              ))}
            </div>
            
            <svg className="absolute inset-0 h-full w-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 1000 160">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="60%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.2)" />
                  <stop offset="100%" stopColor="rgba(59,130,246,0.0)" />
                </linearGradient>
              </defs>
              <polygon points="0,160 30,120 150,110 250,80 400,100 500,40 600,80 700,60 850,70 980,10 1000,160" fill="url(#fillGrad)" />
              <polyline points="0,160 30,120 150,110 250,80 400,100 500,40 600,80 700,60 850,70 980,10" fill="none" stroke="url(#lineGrad)" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' }} />
              {[[150,110],[250,80],[400,100],[500,40],[600,80],[700,60],[850,70],[980,10]].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt[0]} cy={pt[1]} r="4" fill="#fff" stroke="#06b6d4" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,1))' }} />
                  {i === 3 && (
                    <g transform={`translate(${pt[0]}, ${pt[1] - 15})`}>
                      <rect x="-16" y="-12" width="32" height="14" rx="3" fill="#040e24" stroke="#fff" strokeWidth="0.5" strokeOpacity="0.3"/>
                      <text x="0" y="-3" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">+18%</text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
          
          <div className="flex justify-between text-[7px] font-bold text-gray-500 uppercase px-2 pt-2 border-t border-white/[0.03]">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* ── BOTTOM SECTION ── */}
        <div className="grid grid-cols-[1fr_2.2fr] gap-3 h-[320px]">
          
          {/* LEFT: NEURAL SCAN + MENU */}
          <div className="bg-[#050b1a]/90 backdrop-blur-xl border border-blue-500/10 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_5px_20px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden">
            
            {/* Memory AI header */}
            <div className="px-4 pt-4 pb-2 text-center text-[12px] font-black tracking-[0.2em] text-cyan-400 bg-black/10">
              MEMORY AI
            </div>

            {/* Brain */}
            <div className="flex-1 p-4 flex flex-col items-center relative border-b border-white/5 bg-black/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px]" />
              <span className="text-[9px] font-black uppercase text-gray-300 w-full text-center mb-4 tracking-[0.2em] opacity-80">Neural Scan</span>
              <div className="relative mb-auto mt-1">
                <Brain size={75} className="text-[#38bdf8] drop-shadow-[0_0_20px_rgba(56,189,248,0.9)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[30%] border border-cyan-400/50 rounded-[100%] shadow-[0_0_15px_rgba(6,182,212,0.6)] rotate-[15deg]" />
              </div>
              <div className="w-full mt-auto">
                <div className="flex justify-between text-[8px] font-mono text-cyan-300 mb-1.5 opacity-80">
                  <span>SCANNING: <span className="font-black text-white">84%</span></span>
                </div>
                <div className="h-1 w-full bg-[#0b1426] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[84%] shadow-[0_0_8px_#06b6d4]" />
                </div>
              </div>
            </div>

            {/* Nav */}
            <div className="flex flex-col p-2 space-y-1 bg-black/10">
              <button className="relative w-full h-[36px] px-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-cyan-500/[0.15] to-transparent text-cyan-400 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_12px_#06b6d4]" />
                <div className="flex items-center gap-2">
                  <Map size={14} className="opacity-90 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" />
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white">Neural Map</span>
                </div>
              </button>
              <button className="w-full h-[36px] px-3 flex items-center gap-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors">
                <ListTree size={14} />
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">Data Streams</span>
              </button>
              <button className="w-full h-[36px] px-3 flex items-center justify-between rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <HardDrive size={14} />
                  <span className="text-[8px] font-black uppercase tracking-[0.15em]">Core Memories</span>
                </div>
              </button>
              <button className="w-full h-[36px] px-3 flex items-center gap-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors">
                <Cpu size={14} />
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">System Health</span>
              </button>
              <button className="w-full h-[36px] px-3 flex items-center gap-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors">
                <ShieldCheck size={14} />
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">Security Logs</span>
              </button>
            </div>
          </div>

          {/* RIGHT: WEB CLUSTER + VAULT ACTIVITY */}
          <div className="flex flex-col gap-3 h-full">
            
            {/* Neural Web Cluster */}
            <div className="flex-[5] bg-[#050b1a]/90 backdrop-blur-xl border border-blue-500/10 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_5px_20px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start z-10 mb-1">
                <div className="flex items-center gap-2 opacity-80">
                  <Hexagon size={14} className="text-[#3b82f6]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Neural Web Cluster</span>
                </div>
              </div>
              <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1 z-10">Omega-Prime Cluster</div>
              <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest z-10">
                Links: <span className="text-white opacity-90">Active [{val(stats.links)}]</span>
              </div>
              
              <div className="flex-1 w-full relative z-0 mt-2" style={{ minHeight: 100 }}>
                <NeuralWebCluster />
              </div>

              <div className="mt-auto pt-2 border-t border-white/5 flex flex-col gap-1 z-10 relative bg-[#050b1a]/50 backdrop-blur-sm -mx-4 -mb-4 px-4 pb-4">
                <div className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-2">Node Density: <span className="text-white">High</span></div>
                <div className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Synapse Flow: <span className="text-cyan-400 drop-shadow-[0_0_2px_#06b6d4]">Optimal</span></div>
              </div>
            </div>

            {/* Vault Activity */}
            <div className="flex-[4] bg-[#050b1a]/90 backdrop-blur-xl border border-blue-500/10 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_5px_20px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-8 bg-gradient-to-l from-white/5 to-transparent -skew-x-12 translate-x-2 opacity-50 pointer-events-none" />
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white opacity-80">Vault Activity</span>
              </div>

              <div className="flex-1 flex items-end gap-[2px] w-full pl-6 relative">
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-600 pb-4">
                  <span>High</span><span>Med</span><span>Low</span>
                </div>
                {vaultBars.map((bar, i) => {
                  let bg = '#0f172a'
                  let boxShadow = 'none'
                  if (bar.height > 40) bg = '#1e3a8a'
                  if (bar.height > 70) bg = '#2563eb'
                  if (bar.isIntense) {
                    bg = bar.isCyan ? '#06b6d4' : '#60a5fa'
                    boxShadow = bar.isCyan ? '0 0 8px #06b6d4' : '0 0 8px #60a5fa'
                  }
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[1px] opacity-90 hover:opacity-100 hover:brightness-150"
                      style={{ height: `${bar.height}%`, background: bg, boxShadow }}
                    />
                  )
                })}
              </div>

              <div className="flex justify-between mt-2 text-[6px] font-bold text-gray-600 uppercase border-t border-white/5 pt-1.5 pl-6">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
