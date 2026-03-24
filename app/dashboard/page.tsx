'use client'

import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database, Folder, Zap, TrendingUp, Activity, Brain, Network } from 'lucide-react'

// ─── NEURAL WEB CANVAS COMPONENT ─────────────────────────────────────────────
const NeuralWebCluster = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number, y: number, vx: number, vy: number, radius: number }[] = [];

    const init = () => {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = canvas.parentElement?.clientHeight || 250;
      particles = [];
      
      const numParticles = Math.floor((canvas.width * canvas.height) / 6000); 

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: Math.random() * 2 + 1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x += p.vx;
        p.y += p.vy;

        // Glowing Purple Nodes
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(192, 132, 252, 0.9)'; // Purple-400
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#c084fc'; 
        ctx.fill();
        ctx.shadowBlur = 0; 

        // Synapse Connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) { 
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${1 - dist / 100})`; // Purple-500 fading
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden flex flex-col"
         style={{
           background: 'linear-gradient(135deg, rgba(8,8,14,0.98) 0%, rgba(12,12,20,0.95) 100%)',
           border: '1px solid rgba(168,85,247,0.12)',
           boxShadow: '0 0 40px rgba(168,85,247,0.04)',
         }}>
      <div className="px-6 py-4 flex justify-between items-center z-10 absolute top-0 w-full">
         <div className="flex items-center gap-2">
            <Network size={14} className="text-purple-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Neural Web Cluster</h3>
         </div>
         <div className="flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]"></div>
            <span className="text-[9px] font-mono text-purple-400/60 uppercase">OMEGA-PRIME</span>
         </div>
      </div>
      <div className="flex-1 w-full relative mt-12">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none opacity-80" />
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD COMPONENT ────────────────────────────────────────────────
export default function OverviewPage() {
  const [stats, setStats] = useState({ totalMemories: 0, totalProjects: 0, totalFiles: 0 })
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

      setStats({
        totalMemories: mCount || 0,
        totalProjects: pCount || 0,
        totalFiles: fCount || 0,
      })

      if (tagData) {
        const freq: Record<string, number> = {}
        tagData.forEach((m: any) => { if (m.tag) freq[m.tag] = (freq[m.tag] || 0) + 1 })
        const sorted = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([label, count]) => ({ label, count }))
        setTopTags(sorted)
      }

      setLoading(false)
    }
    fetchStats()
  }, [])

  const maxTagCount = topTags[0]?.count || 1

  const cards = [
    {
      name: 'Total Memories',
      value: stats.totalMemories,
      icon: Brain,
      glow: 'rgba(168,85,247,0.15)', // Purple glow
      border: 'rgba(168,85,247,0.25)',
      iconColor: '#c084fc',
      accent: '#a855f7',
    },
    {
      name: 'Active Projects',
      value: stats.totalProjects,
      icon: Folder,
      glow: 'rgba(217,70,239,0.12)', // Fuchsia glow
      border: 'rgba(217,70,239,0.2)',
      iconColor: '#e879f9',
      accent: '#d946ef',
    },
    {
      name: 'Synced Files',
      value: stats.totalFiles,
      icon: Database,
      glow: 'rgba(139,92,246,0.12)', // Violet glow
      border: 'rgba(139,92,246,0.2)',
      iconColor: '#a78bfa',
      accent: '#8b5cf6',
    },
    {
      name: 'Neural Links',
      value: stats.totalMemories * 3 + stats.totalFiles,
      icon: Zap,
      glow: 'rgba(236,72,153,0.12)', // Pink glow
      border: 'rgba(236,72,153,0.2)',
      iconColor: '#f472b6',
      accent: '#ec4899',
    },
  ]

  const barHeights = [35, 60, 42, 88, 55, 75, 28, 92, 48, 80, 65, 44]

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ── CINEMATIC BACKGROUND (PURPLE THEME) ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050507]" />

        {/* Central god-ray */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[70vh]"
          style={{
            background: 'radial-gradient(ellipse 40% 80% at 50% 0%, rgba(168,85,247,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Left ambient — deep purple */}
        <div className="absolute top-0 left-0 w-[50%] h-[60%]"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 0% 20%, rgba(88,28,135,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Right ambient — void darkness */}
        <div className="absolute top-0 right-0 w-[50%] h-[60%]"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 100% 20%, rgba(10,5,20,0.6) 0%, transparent 70%)',
          }}
        />

        <div className="absolute bottom-0 inset-x-0 h-[30%]"
          style={{ background: 'linear-gradient(to top, rgba(5,5,10,0.9) 0%, transparent 100%)' }}
        />

        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />

        {/* Vertical light split */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px"
          style={{
            background: 'linear-gradient(to bottom, rgba(168,85,247,0.3) 0%, rgba(168,85,247,0.05) 40%, transparent 80%)',
            boxShadow: '0 0 20px 1px rgba(168,85,247,0.1)',
          }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 space-y-6 p-6 md:p-8 animate-in fade-in duration-700 max-w-7xl mx-auto">

        {/* Header */}
        <div className="pt-4 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-px bg-purple-500/60" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400/80">Neural Command</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase italic">
            System Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time diagnostics of your neural vault.</p>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {cards.map((card) => (
            <div
              key={card.name}
              className="relative rounded-2xl p-5 overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-default"
              style={{
                background: `linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(15,15,22,0.9) 100%)`,
                border: `1px solid ${card.border}`,
                boxShadow: `0 0 30px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-40"
                style={{ background: card.glow, transform: 'translate(30%, -30%)' }} />

              <div className="relative z-10 mb-4 inline-flex p-2 rounded-xl"
                style={{ background: `${card.glow}`, border: `1px solid ${card.border}` }}>
                <card.icon size={18} style={{ color: card.iconColor }} />
              </div>

              <div className="relative z-10">
                <div className="text-3xl font-black text-white tracking-tight leading-none mb-1">
                  {loading ? (
                    <div className="w-12 h-8 bg-white/5 rounded animate-pulse" />
                  ) : card.value}
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500">{card.name}</div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(to right, transparent, ${card.accent}60, transparent)` }} />
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW 1: KNOWLEDGE & TAGS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          
          {/* Knowledge Density Bar Chart */}
          <div className="lg:col-span-2 rounded-2xl p-6 flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(8,8,14,0.98) 0%, rgba(12,12,20,0.95) 100%)',
              border: '1px solid rgba(168,85,247,0.12)',
              boxShadow: '0 0 40px rgba(168,85,247,0.04)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Knowledge Density</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400">+12%</span>
              </div>
            </div>

            <div className="flex-1 flex items-end gap-1.5 min-h-[160px]">
              {barHeights.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group">
                  <div
                    className="rounded-t-sm relative overflow-hidden transition-all duration-700"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute inset-0"
                      style={{
                        background: h > 70
                          ? 'linear-gradient(to top, rgba(147,51,234,0.5), rgba(192,132,252,0.8))'
                          : 'linear-gradient(to top, rgba(88,28,135,0.4), rgba(168,85,247,0.35))',
                        borderTop: h > 70 ? '1px solid rgba(192,132,252,0.6)' : '1px solid rgba(168,85,247,0.3)',
                      }}
                    />
                    {h > 70 && (
                      <div className="absolute top-0 inset-x-0 h-2 blur-sm"
                        style={{ background: 'rgba(192,132,252,0.5)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5 mt-2">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                <div key={m} className="flex-1 text-center text-[8px] text-gray-600 font-bold">{m}</div>
              ))}
            </div>
          </div>

          {/* Top Tags Panel */}
          <div className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(8,8,14,0.98) 0%, rgba(12,12,20,0.95) 100%)',
              border: '1px solid rgba(168,85,247,0.12)',
            }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-6">
              Top Labels
            </span>

            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                    <div className="h-1 bg-white/5 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : topTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Brain size={24} className="text-gray-700 mb-2" />
                <p className="text-[11px] text-gray-600">No tags yet.<br/>Label your memories.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {topTags.map(({ label, count }, i) => {
                  const pct = Math.round((count / maxTagCount) * 100)
                  return (
                    <div key={label} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">{label}</span>
                        <span className="text-[10px] font-mono text-purple-400">{count}</span>
                      </div>
                      <div className="h-1 w-full rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${pct}%`,
                            background: i === 0
                              ? 'linear-gradient(to right, #9333ea, #c084fc)'
                              : i === 1
                              ? 'linear-gradient(to right, #7e22ce, #a855f7)'
                              : 'linear-gradient(to right, #581c87, #9333ea)',
                            boxShadow: i === 0 ? '0 0 8px rgba(192,132,252,0.4)' : 'none',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── CHARTS ROW 2: NEURAL WEB & VAULT ACTIVITY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Neural Web Component (Takes up 2 columns) */}
          <div className="lg:col-span-2">
            <NeuralWebCluster />
          </div>

          {/* Vault Activity (Takes up 1 column) */}
          <div className="rounded-2xl p-6 flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(8,8,14,0.98) 0%, rgba(12,12,20,0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-purple-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Vault Activity</span>
            </div>
            <div className="grid grid-rows-3 grid-flow-col gap-1 flex-1" style={{ gridTemplateRows: 'repeat(3, 1fr)' }}>
              {Array.from({ length: 45 }).map((_, i) => {
                const intensity = Math.random()
                return (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] transition-all duration-300"
                    style={{
                      background: intensity > 0.8
                        ? 'rgba(192,132,252,0.9)'
                        : intensity > 0.6
                        ? 'rgba(168,85,247,0.5)'
                        : intensity > 0.3
                        ? 'rgba(88,28,135,0.4)'
                        : 'rgba(255,255,255,0.04)',
                      boxShadow: intensity > 0.8 ? '0 0 6px rgba(192,132,252,0.5)' : 'none',
                    }}
                  />
                )
              })}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  )
}
