"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ListTree, HardDrive, Cpu, ShieldCheck 
} from 'lucide-react';
// ... the rest of your dashboard code
// ─── NEURAL WEB CLUSTER ANIMATION ──────────────────────────────────────────
const NeuralWebCluster = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let particles = [];

    const init = () => {
      // Ensure canvas fills the container
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      particles = [];
      
      const numParticles = Math.floor((canvas.width * canvas.height) / 8000); // Responsive particle count
      
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 1.5 + 0.5,
          isCyan: Math.random() > 0.5,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x += p.vx; 
        p.y += p.vy;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isCyan ? '#06b6d4' : '#a855f7';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const grad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            grad.addColorStop(0, p.isCyan ? 'rgba(6,182,212,0.4)' : 'rgba(168,85,247,0.4)');
            grad.addColorStop(1, p2.isCyan ? 'rgba(6,182,212,0.4)' : 'rgba(168,85,247,0.4)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();
    
    window.addEventListener('resize', init);
    return () => { 
      cancelAnimationFrame(animationFrameId); 
      window.removeEventListener('resize', init); 
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
    />
  );
};

// ─── MAIN DASHBOARD COMPONENT ────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);

  // High-fidelity mock data for immediate rendering
  const stats = { 
    memories: 14205, 
    projects: 128, 
    clusters: 42, 
    files: 8432, 
    links: 39420 
  };
  
  const topTags = [
    { label: 'ARCHITECTURE', count: 432 },
    { label: 'REACT CORE', count: 321 },
    { label: 'NEURAL NETS', count: 210 },
    { label: 'UI/UX DESIGN', count: 184 },
    { label: 'API ROUTES', count: 96 }
  ];

  // Simulate a quick boot-up sequence
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Stable random vault bars
  const vaultBars = useMemo(() => 
    Array.from({ length: 90 }, () => {
      const height = Math.random() * 90 + 10;
      const isIntense = Math.random() > 0.85;
      const isCyan = Math.random() > 0.90;
      return { height, isIntense, isCyan };
    }),
  []);

  const formatNum = (num) => loading ? '—' : num.toLocaleString();

  return (
    <div className="min-h-screen bg-[#030108] text-white p-4 md:p-8 font-sans overflow-x-hidden selection:bg-purple-500/30">
      
      {/* ── AMBIENT BACKGROUND GLOWS ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        {/* Deep background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        {/* Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,_rgba(168,85,247,0.15)_0%,_transparent_60%)] blur-[100px]" />
        <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,_rgba(6,182,212,0.1)_0%,_transparent_60%)] blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,_rgba(168,85,247,0.1)_0%,_transparent_60%)] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-6">
        
        {/* ── HEADER ── */}
        <header className="flex items-start gap-4 mb-2">
          <button className="mt-1 w-10 h-10 flex items-center justify-center bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all text-purple-400">
            <Menu size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-[2px] bg-purple-500 shadow-[0_0_8px_#a855f7]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">Neural Command</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              System Overview
            </h1>
            <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-[0.2em] mt-1">
              Real-time diagnostics of your neural vault.
            </p>
          </div>
        </header>

        {/* ── TOP STAT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Memories */}
            <div className="bg-gradient-to-br from-[#120a21]/90 to-[#0c0617]/90 backdrop-blur-xl border border-purple-500/20 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <Brain size={20} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] mb-3" />
              <div className="text-3xl md:text-4xl font-black text-white leading-none mb-2">{formatNum(stats.memories)}</div>
              <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Total Memories</span>
                <span className="text-purple-400">90%</span>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-gradient-to-br from-[#120a21]/90 to-[#0c0617]/90 backdrop-blur-xl border border-purple-500/20 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <Folder size={20} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] mb-3" />
              <div className="text-3xl md:text-4xl font-black text-white leading-none mb-2">{formatNum(stats.projects)}</div>
              <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Active Projects</span>
                <span className="text-purple-400">90%</span>
              </div>
            </div>

            {/* Neural Clusters */}
            <div className="bg-gradient-to-br from-[#0a1122]/90 to-[#050812]/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group md:col-span-1 col-span-2">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90 group-hover:shadow-[0_0_15px_#06b6d4] transition-all" />
              <Hexagon size={20} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] mb-3" />
              <div className="text-3xl md:text-4xl font-black text-white leading-none mb-2">{formatNum(stats.clusters)}</div>
              <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Neural Clusters</span>
                <span className="text-cyan-400">90%</span>
              </div>
            </div>

            {/* Owned Files */}
            <div className="md:col-span-2 col-span-1 bg-gradient-to-br from-[#120a21]/90 to-[#0c0617]/90 backdrop-blur-xl border border-purple-500/20 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              <FileText size={20} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] mb-3" />
              <div className="text-3xl md:text-4xl font-black text-white leading-none mb-2">{formatNum(stats.files)}</div>
              <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Owned Files</span>
                <span className="text-purple-400">90%</span>
              </div>
            </div>

            {/* Neural Links */}
            <div className="col-span-1 bg-gradient-to-br from-[#0a1122]/90 to-[#050812]/90 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 group-hover:shadow-[0_0_15px_#06b6d4] transition-all" />
              <Zap size={20} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] mb-3" />
              <div className="text-3xl md:text-4xl font-black text-white leading-none mb-2">{formatNum(stats.links)}</div>
              <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Neural Links</span>
                <span className="text-cyan-400">90%</span>
              </div>
            </div>
          </div>

          {/* Top Labels */}
          <div className="lg:col-span-1 bg-gradient-to-b from-[#100a18]/90 to-[#08050e]/90 backdrop-blur-xl border border-purple-500/20 rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_20px_rgba(0,0,0,0.5)]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
              <Tag size={12} className="text-purple-400" />
              Top Labels
            </div>
            
            <div className="flex flex-col gap-4 flex-1 justify-center">
              {topTags.map(({ label, count }, i) => (
                <div key={label} className="group">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-white transition-colors">{label}</span>
                    <span className="text-[10px] font-black text-purple-400">{loading ? '-' : count}</span>
                  </div>
                  <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{
                        width: loading ? '0%' : `${Math.round((count / topTags[0].count) * 100)}%`,
                        background: i === 0 ? 'linear-gradient(to right,#7c3aed,#c084fc)' : 
                                    i === 1 ? 'linear-gradient(to right,#0e7490,#22d3ee)' : 
                                    'linear-gradient(to right,#4c1d95,#8b5cf6)',
                        boxShadow: i === 0 ? '0 0 10px rgba(192,132,252,0.5)' : 'none'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── KNOWLEDGE DENSITY GRAPH ── */}
        <div className="bg-[#0b0813]/80 backdrop-blur-2xl border border-white/5 rounded-xl p-6 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_15px_40px_rgba(0,0,0,0.8)] min-h-[300px] flex flex-col overflow-hidden">
          
          <div className="flex justify-between items-start z-10 relative">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/10 rounded-md border border-purple-500/20">
                <Activity size={16} className="text-purple-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.25em] text-gray-200">Knowledge Density</span>
            </div>
            <div className="text-right">
              <div className="text-cyan-400 font-black text-lg flex items-center justify-end gap-1 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                +12.4%
              </div>
              <div className="text-[9px] text-cyan-500/80 font-black uppercase tracking-widest mt-0.5">Mo/Mo Growth</div>
            </div>
          </div>

          {/* Floating HUD Panel */}
          <div className="hidden md:block absolute right-[25%] top-12 z-30 w-[220px] bg-[#110d1c]/95 border border-purple-500/30 rounded-lg p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9),_0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
              <div className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Node Intelligence</div>
            </div>
            <div className="space-y-1.5 text-[9px] uppercase tracking-wider font-bold">
              <div className="text-purple-300 border-b border-purple-500/20 pb-1 mb-2">ID: OMEGA-PRIME-9X</div>
              <div className="flex justify-between"><span className="text-gray-500">Encryption:</span> <span className="text-white">Level Omega</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Synapse Str:</span> <span className="text-cyan-400">98.2%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Throughput:</span> <span className="text-white">4.2 TB/s</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Latency:</span> <span className="text-white">0.02 ms</span></div>
              
              <div className="mt-3 pt-2 border-t border-white/5">
                <div className="text-gray-500 mb-1">Activity Resonance</div>
                <div className="h-4 w-full relative overflow-hidden rounded bg-black/50">
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                    <path d="M0,10 Q10,2 20,10 T40,10 T60,10 T80,5 T100,10" fill="none" stroke="#a855f7" strokeWidth="2" filter="drop-shadow(0 0 3px #a855f7)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Line Chart Area */}
          <div className="flex-1 relative w-full mt-4 -mb-2">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10 py-4 pointer-events-none">
              {[1,2,3,4,5,6].map((v) => (
                <div key={v} className="w-full border-b border-white border-dashed h-0"></div>
              ))}
            </div>
            
            {/* SVG Graph */}
            <svg className="absolute inset-0 h-full w-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 1000 200">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.2)" />
                  <stop offset="50%" stopColor="rgba(168,85,247,0.05)" />
                  <stop offset="100%" stopColor="rgba(168,85,247,0.0)" />
                </linearGradient>
              </defs>
              
              {/* Fill */}
              <polygon 
                className={`transition-all duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}
                points="0,200 50,150 150,130 250,90 380,110 500,40 650,80 750,50 850,70 1000,20 1000,200" 
                fill="url(#fillGrad)" 
              />
              
              {/* Glowing Line */}
              <polyline 
                className={`transition-all duration-1000 ${loading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                points="0,150 50,150 150,130 250,90 380,110 500,40 650,80 750,50 850,70 1000,20" 
                fill="none" 
                stroke="url(#lineGrad)" 
                strokeWidth="4" 
                style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.8))' }} 
              />
              
              {/* Data Points */}
              {[[150,130],[250,90],[380,110],[500,40],[650,80],[750,50],[850,70]].map((pt, i) => (
                <g key={i} className={`transition-all duration-700 delay-${i * 100} ${loading ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} style={{ transformOrigin: `${pt[0]}px ${pt[1]}px` }}>
                  <circle cx={pt[0]} cy={pt[1]} r="5" fill="#110d1c" stroke={i % 2 === 0 ? "#06b6d4" : "#a855f7"} strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }} />
                  {/* Highlight on main point */}
                  {i === 3 && (
                    <circle cx={pt[0]} cy={pt[1]} r="12" fill="none" stroke="#06b6d4" strokeWidth="1" className="animate-ping" />
                  )}
                </g>
              ))}
            </svg>
          </div>
          
          <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase px-2 pt-4 border-t border-white/[0.05] relative z-10 tracking-widest">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* ── BOTTOM SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: NEURAL SCAN + MENU */}
          <div className="lg:col-span-1 bg-[#0e0917]/90 backdrop-blur-xl border border-white/5 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_10px_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden min-h-[400px]">
            
            {/* Brain Scan */}
            <div className="p-6 flex flex-col items-center relative border-b border-white/5 bg-gradient-to-b from-purple-900/10 to-transparent flex-1">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 blur-[50px] pointer-events-none" />
              <span className="text-xs font-black uppercase text-gray-300 w-full text-left mb-6 tracking-[0.2em]">Neural Scan</span>
              
              <div className="relative mb-8 mt-2">
                <Brain size={100} className="text-purple-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.8)]" strokeWidth={1} />
                {/* Orbital Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[40%] border border-purple-400/30 rounded-[100%] shadow-[0_0_20px_rgba(168,85,247,0.4)] rotate-[20deg] animate-[spin_10s_linear_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[30%] border border-cyan-400/30 rounded-[100%] shadow-[0_0_15px_rgba(6,182,212,0.4)] -rotate-[15deg] animate-[spin_15s_linear_infinite_reverse]" />
              </div>
              
              <div className="w-full mt-auto">
                <div className="flex justify-between text-[10px] font-mono text-purple-300 mb-2 tracking-wider">
                  <span>Diagnostic Scan</span>
                  <span className="font-black text-white">84.2%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1c1230] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 w-[84%] shadow-[0_0_10px_#a855f7] relative">
                    <div className="absolute top-0 bottom-0 right-0 w-4 bg-white/50 blur-[2px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex flex-col p-3 space-y-1 bg-black/20">
              <button className="relative w-full h-[44px] px-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-cyan-500/[0.15] to-transparent text-cyan-400 border border-cyan-500/20 overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_#06b6d4]" />
                <div className="flex items-center gap-3">
                  <Map size={16} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Neural Map</span>
                </div>
              </button>
              
              {[
                { icon: ListTree, label: 'Data Streams' },
                { icon: HardDrive, label: 'Core Memories', right: `${stats.files}F` },
                { icon: Cpu, label: 'System Health' },
                { icon: ShieldCheck, label: 'Security Logs' }
              ].map((item, i) => (
                <button key={i} className="w-full h-[44px] px-4 flex items-center justify-between rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className="group-hover:text-purple-400 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                  </div>
                  {item.right && (
                    <span className="text-[10px] font-black text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">{loading ? '—' : item.right}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: WEB CLUSTER + VAULT ACTIVITY */}
          <div className="lg:col-span-2 flex flex-col gap-6 h-full">
            
            {/* Neural Web Cluster */}
            <div className="flex-1 bg-gradient-to-br from-[#0e0917]/90 to-[#08050e]/90 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_10px_30px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden min-h-[200px]">
              <div className="flex justify-between items-start z-10 mb-2">
                <div className="flex items-center gap-2">
                  <Hexagon size={16} className="text-purple-400" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Neural Web Cluster</span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Omega-Prime Sector</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Links: <span className="text-cyan-400 shadow-cyan-400/50">[{formatNum(stats.links)}]</span>
                  </div>
                </div>
              </div>
              
              {/* Canvas Container */}
              <div className="flex-1 w-full relative z-0 my-2 rounded-lg border border-white/[0.02] bg-black/20 overflow-hidden">
                <NeuralWebCluster />
              </div>

              <div className="flex justify-between items-end mt-2 z-10">
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  Node Density: <span className="text-white">High</span>
                </div>
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  Synapse Flow: <span className="text-cyan-400 drop-shadow-[0_0_5px_#06b6d4]">Optimal</span>
                </div>
              </div>
            </div>

            {/* Vault Activity */}
            <div className="h-[180px] bg-gradient-to-br from-[#0e0917]/90 to-[#08050e]/90 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_10px_30px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-12 bg-gradient-to-l from-white/5 to-transparent -skew-x-12 translate-x-4 opacity-50 pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Vault Activity</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Live Heatmap</span>
                  <div className="w-2 h-2 bg-cyan-400 rounded-sm shadow-[0_0_8px_#06b6d4] animate-pulse"></div>
                </div>
              </div>

              <div className="flex-1 flex items-end gap-[2px] w-full pl-8 relative z-10">
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-bold text-gray-600 pb-5">
                  <span>Max</span><span>Avg</span><span>Min</span>
                </div>
                
                {vaultBars.map((bar, i) => {
                  let bg = '#1e1536';
                  let boxShadow = 'none';
                  
                  if (bar.height > 40) bg = '#5b21b6'; // purple-800
                  if (bar.height > 70) bg = '#7e22ce'; // purple-700
                  if (bar.isIntense) {
                    bg = bar.isCyan ? '#06b6d4' : '#a855f7';
                    boxShadow = bar.isCyan ? '0 0 10px #06b6d4' : '0 0 10px #a855f7';
                  }
                  
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[2px] opacity-90 hover:opacity-100 hover:brightness-150 transition-all cursor-pointer"
                      style={{ 
                        height: loading ? '5%' : `${bar.height}%`, 
                        background: bg, 
                        boxShadow,
                        transitionDelay: `${i * 5}ms`
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between mt-3 text-[9px] font-black text-gray-600 uppercase border-t border-white/[0.05] pt-2 pl-8 relative z-10">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
