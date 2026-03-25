'use client'

import { useEffect, useRef } from 'react'
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ListTree, HardDrive, Cpu, ShieldCheck, 
  Menu, FileText, Activity
} from 'lucide-react'

// ─── NEURAL WEB CLUSTER CANVAS ───────────────────────────────────────────────
const NeuralWebCluster = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number, y: number, vx: number, vy: number, radius: number, isCyan: boolean }[] = [];

    const init = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500;
      canvas.height = canvas.parentElement?.clientHeight || 200;
      particles = [];
      const numParticles = 80;

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          isCyan: Math.random() > 0.4,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x += p.vx; p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isCyan ? '#06b6d4' : '#a855f7'; 
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const grad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            grad.addColorStop(0, p.isCyan ? 'rgba(6,182,212,0.6)' : 'rgba(168,85,247,0.6)');
            grad.addColorStop(1, p2.isCyan ? 'rgba(6,182,212,0.6)' : 'rgba(168,85,247,0.6)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init(); animate();
    window.addEventListener('resize', init);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', init); }
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};


// ─── MAIN DASHBOARD COMPONENT ────────────────────────────────────────────────
export default function OverviewPage() {
  return (
    <div className="relative min-h-screen bg-[#06040a] text-white p-4 font-sans overflow-x-auto selection:bg-purple-500/30">
      
      {/* ── BACKGROUND AMBIANCE ── */}
      <div className="fixed inset-0 pointer-events-none z-0 min-w-[850px] overflow-hidden flex justify-center items-center">
        {/* Deep, subtle matrix background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
        
        {/* Colored glowing blobs matching reference image */}
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(168,85,247,0.15)_0%,_transparent_60%)] blur-[80px]" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(6,182,212,0.1)_0%,_transparent_60%)] blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(168,85,247,0.1)_0%,_transparent_60%)] blur-[100px]" />
      </div>

      <div className="relative z-10 w-[850px] max-w-[1200px] mx-auto flex flex-col gap-4 pb-6">
        
        {/* HEADER */}
        <header className="flex flex-col mb-1 relative pt-2">
          {/* Subtle Menu Icon */}
          <div className="absolute -left-1 -top-1 w-8 h-8 flex flex-col justify-center items-center cursor-pointer opacity-80 hover:opacity-100 group">
             <div className="w-5 h-0.5 bg-purple-500 mb-1 group-hover:bg-purple-400 transition" />
             <div className="w-5 h-0.5 bg-purple-500 mb-1 group-hover:bg-purple-400 transition" />
             <div className="w-5 h-0.5 bg-purple-500 group-hover:bg-purple-400 transition" />
          </div>

          <div className="pl-10">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-[1.5px] bg-purple-500/80 shadow-[0_0_5px_#a855f7]" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-400">Neural Command</span>
            </div>
            <h1 className="text-[26px] font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              System Overview
            </h1>
            <p className="text-gray-500 text-[9px] uppercase tracking-wider mt-0.5">Real-time diagnostics of your neural vault.</p>
          </div>
        </header>

        {/* ── TOP GRID STRUCTURE ── */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1.3fr] gap-3 h-[180px]">
          
          {/* Col 1 & 2 & 3: Inner Grid for Stats */}
          <div className="col-span-3 grid grid-cols-[1fr_1fr_1fr] grid-rows-[1fr_1fr] gap-3 h-full">
             
            {/* Box 1: Memories */}
            <div className="bg-gradient-to-br from-[#120a21]/90 to-[#0c0617]/90 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(168,85,247,0.05)] relative overflow-hidden flex flex-col justify-center group">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />
              <div className="flex items-center gap-2 mb-1.5">
                <Brain size={16} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              </div>
              <div className="text-[28px] font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none mb-1">169</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Total Memories <span className="text-gray-600">90%</span></div>
            </div>

            {/* Box 2: Active Projects */}
            <div className="bg-gradient-to-br from-[#120a21]/90 to-[#0c0617]/90 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(168,85,247,0.05)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />
              <div className="flex items-center gap-2 mb-1.5">
                <Folder size={16} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              </div>
              <div className="text-[28px] font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none mb-1">4</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Active Projects <span className="text-gray-600">90%</span></div>
            </div>

            {/* Box 3: Neural Clusters */}
            <div className="bg-gradient-to-br from-[#0c1324]/90 to-[#060a14]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90" />
              <div className="flex items-center gap-2 mb-1.5">
                <Hexagon size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
              <div className="text-[28px] font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none mb-1">8</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Neural Clusters <span className="text-gray-600">90%</span></div>
            </div>

            {/* Box 4: Owned Files (Spans 2 cols) */}
            <div className="col-span-2 bg-gradient-to-br from-[#120a21]/90 to-[#0c0617]/90 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(168,85,247,0.05)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" />
              <div className="flex items-center gap-2 mb-1.5">
                <FileText size={16} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              </div>
              <div className="text-[28px] font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none mb-1">169</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Owned Files <span className="text-gray-600">90%</span></div>
            </div>

            {/* Box 5: Neural Links */}
            <div className="bg-gradient-to-br from-[#0c1324]/90 to-[#060a14]/90 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_rgba(6,182,212,0.08)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
              <div className="flex items-center gap-2 mb-1.5">
                <Zap size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
              <div className="text-[28px] font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none mb-1">175</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Neural Links <span className="text-gray-600">90%</span></div>
            </div>
          </div>

          {/* Col 4: Top Labels (Full Height) */}
          <div className="h-full bg-gradient-to-b from-[#100a18]/90 to-[#08050e]/90 backdrop-blur-md border border-purple-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] relative overflow-hidden">
             <div className="absolute top-3 left-4 text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Top Labels</div>
             <div className="mt-4 mb-3 opacity-20 relative">
                <Tag size={40} className="text-purple-400 stroke-[1.5] -rotate-45 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
             </div>
             <div className="text-[9px] font-black text-purple-400 tracking-[0.15em] uppercase mb-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] leading-tight">
               Awaiting<br/>Classification
             </div>
             <div className="text-[7px] text-gray-500 uppercase tracking-widest mt-1">Initialize tagging protocol</div>
          </div>

        </div>

        {/* ── KNOWLEDGE DENSITY GRAPH ── */}
        <div className="bg-[#0b0813]/80 backdrop-blur-xl border border-white/5 rounded-xl p-5 relative overflow-visible shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_10px_30px_rgba(0,0,0,0.8)] h-[240px] flex flex-col">
           <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-2 opacity-80">
                <Activity size={12} className="text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-300">Knowledge Density</span>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-black text-sm flex items-center justify-end gap-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                   +12%
                </div>
                <div className="text-[7px] text-cyan-500/80 font-black uppercase tracking-widest mt-0.5">MO/MO GROWTH</div>
              </div>
           </div>

           {/* Floating Node Intelligence Panel */}
           <div className="absolute right-[22%] top-8 z-30 w-[190px] bg-[#110d1c]/95 border border-purple-500/30 rounded-lg p-3 shadow-[0_15px_40px_rgba(0,0,0,0.9),_0_0_20px_rgba(168,85,247,0.1)] backdrop-blur-md">
              <div className="text-[9px] font-black text-white uppercase tracking-[0.15em] mb-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">NODE INTELLIGENCE</div>
              <div className="space-y-1 text-[7px] uppercase tracking-wider font-bold">
                 <div className="text-purple-300">NODE: OMEGA PRINK-6K</div>
                 <div className="text-gray-400 mt-1.5">MICROPPTION LEVEL: <span className="text-white">OMEGA</span></div>
                 <div className="text-gray-400">STRAPYK MACKO 70: <span className="text-white">35%</span></div>
                 <div className="text-gray-400">DATA. THROUBSIUP: <span className="text-white">4.5 TSLS</span></div>
                 <div className="text-gray-400">EATURES: <span className="text-white">6 GMLUX</span></div>
                 <div className="text-gray-400">SAGDED BOMINEL: <span className="text-white">ARTYFE</span></div>
                 <div className="text-gray-400">LAW ACCESS: <span className="text-white">G.SEA9 A00</span></div>
                 <div className="text-gray-400">LAW ACCESS: <span className="text-white">D3BAIPAY</span></div>
                 <div className="text-gray-400">CDM CLUSTER: <span className="text-white">MCRLHABLE</span></div>
                 <div className="text-gray-400 mt-1.5 opacity-80">SYNAPSE ACTIVITY</div>
                 
                 {/* Tooltip Mini-Sparkline */}
                 <div className="h-4 w-full mt-1">
                    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                       <path d="M0,15 Q10,12 20,16 T40,14 T60,18 T80,10 T100,15" fill="none" stroke="#a855f7" strokeWidth="1.5" filter="drop-shadow(0 0 2px #a855f7)" />
                    </svg>
                 </div>
              </div>
           </div>

           {/* SVG Graph Layout */}
           <div className="flex-1 relative w-full mt-2 -mb-2">
              <div className="absolute inset-0 flex flex-col justify-between opacity-10 py-4">
                 {[90,70,50,30,10,0].map((v,i) => (
                    <div key={i} className="flex items-center w-full">
                       <span className="text-[6px] text-white/50 w-4 text-right pr-1 absolute -left-4">{v}%</span>
                       <div className="border-b border-white border-dashed w-full h-0"></div>
                    </div>
                 ))}
              </div>
              
              <svg className="absolute inset-0 h-full w-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 1000 160">
                 <defs>
                   <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="60%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#06b6d4" />
                   </linearGradient>
                   <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(6,182,212,0.15)" />
                      <stop offset="100%" stopColor="rgba(168,85,247,0.0)" />
                   </linearGradient>
                 </defs>
                 
                 <polygon points="0,160 30,120 150,110 250,80 400,100 500,40 600,80 700,60 850,70 980,10 1000,160" fill="url(#fillGrad)" />
                 <polyline points="0,160 30,120 150,110 250,80 400,100 500,40 600,80 700,60 850,70 980,10" fill="none" stroke="url(#lineGrad)" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' }} />

                 {[ [150,110], [250,80], [400,100], [500,40], [600,80], [700,60], [850,70], [980,10] ].map((pt, i) => (
                    <g key={i}>
                       <circle cx={pt[0]} cy={pt[1]} r="4" fill="#fff" stroke="#06b6d4" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,1))' }} />
                       {/* +12% Tooltip Marker */}
                       {i === 3 && (
                         <g transform={`translate(${pt[0]}, ${pt[1] - 15})`}>
                            <rect x="-16" y="-12" width="32" height="14" rx="3" fill="#110e1c" stroke="#fff" strokeWidth="0.5" strokeOpacity="0.3"/>
                            <text x="0" y="-3" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">+12%</text>
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

        {/* ── BOTTOM SECTION: UNIFIED GRID ── */}
        <div className="grid grid-cols-[1fr_2.2fr] gap-3 h-[320px]">
          
          {/* LEFT: UNIFIED NEURAL SCAN & MENU PANEL */}
          <div className="bg-[#0e0917]/90 backdrop-blur-xl border border-white/5 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_5px_20px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden">
             
             {/* Top: Brain Visualizer */}
             <div className="flex-1 p-4 flex flex-col items-center relative border-b border-white/5 bg-black/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px]" />
                <span className="text-[10px] font-black uppercase text-gray-300 w-full text-left mb-6 tracking-[0.2em] opacity-80">Neural Scan</span>
                
                <div className="relative mb-auto mt-2">
                   {/* Glowing Brain Element */}
                   <Brain size={80} className="text-[#c084fc] opacity-100 drop-shadow-[0_0_20px_rgba(168,85,247,0.9)]" />
                   {/* Planetary Orbit Ring */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[30%] border border-purple-400/50 rounded-[100%] shadow-[0_0_15px_rgba(168,85,247,0.6)] rotate-[15deg]" />
                </div>
                
                <div className="w-full mt-auto">
                   <div className="flex justify-between text-[8px] font-mono text-purple-300 mb-1.5 opacity-80">
                     <span>Scanning: <span className="font-black text-white">84%</span></span>
                   </div>
                   <div className="h-1 w-full bg-[#1c1230] rounded-full overflow-hidden">
                     <div className="h-full bg-purple-500 w-[84%] shadow-[0_0_8px_#a855f7]" />
                   </div>
                </div>
             </div>

             {/* Bottom: Navigation Menu directly inside the same card */}
             <div className="flex flex-col p-2 space-y-1 bg-black/10">
                {/* Active Cyan Item */}
                <button className="relative w-full h-[36px] px-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-cyan-500/[0.15] to-transparent text-cyan-400 overflow-hidden group">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_12px_#06b6d4]" />
                   <div className="flex items-center gap-2">
                     <Map size={14} className="opacity-90 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" />
                     <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Neural Map</span>
                   </div>
                </button>
                
                {/* Inactive Items */}
                <button className="w-full h-[36px] px-3 flex items-center gap-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors">
                   <ListTree size={14} />
                   <span className="text-[8px] font-black uppercase tracking-[0.15em]">Data Streams</span>
                </button>
                <button className="w-full h-[36px] px-3 flex items-center justify-between rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors">
                   <div className="flex items-center gap-2">
                     <HardDrive size={14} />
                     <span className="text-[8px] font-black uppercase tracking-[0.15em]">Core Memories</span>
                   </div>
                   <span className="text-[8px] font-black text-[#d946ef] drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">175TB</span>
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

          {/* RIGHT: WEB CLUSTER & VAULT ACTIVITY (Stacked, exact heights to match left) */}
          <div className="flex flex-col gap-3 h-full">
            
            {/* NEURAL WEB CLUSTER PANEL (Takes up ~60% height) */}
            <div className="flex-[5] bg-[#0e0917]/90 backdrop-blur-xl border border-white/5 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_5px_20px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
               <div className="flex justify-between items-start z-10 mb-1">
                 <div className="flex items-center gap-2 opacity-80">
                   <Hexagon size={14} className="text-[#a855f7]" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Neural Web Cluster</span>
                 </div>
               </div>
               
               <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1 z-10">Omega-Prime Cluster</div>
               <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest z-10">Links: <span className="text-white opacity-90">Active [94]</span></div>
               
               {/* Animated Node Graph */}
               <div className="flex-1 w-full relative z-0 mt-2 min-h-[100px]">
                 <NeuralWebCluster />
               </div>

               <div className="mt-auto pt-2 border-t border-white/5 flex flex-col gap-1 z-10 relative bg-[#0e0917]/50 backdrop-blur-sm -mx-4 -mb-4 px-4 pb-4">
                  <div className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-2">Node Density: <span className="text-white">High</span></div>
                  <div className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Synapse Flow: <span className="text-cyan-400 drop-shadow-[0_0_2px_#06b6d4]">Optimal</span></div>
               </div>
            </div>

            {/* VAULT ACTIVITY PANEL (Takes up ~40% height) */}
            <div className="flex-[4] bg-[#0e0917]/90 backdrop-blur-xl border border-white/5 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_5px_20px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-8 bg-gradient-to-l from-white/5 to-transparent -skew-x-12 translate-x-2 opacity-50 pointer-events-none" />
              
              <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white opacity-80">Vault Activity</span>
                 <div className="flex items-center gap-2">
                   <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">Ortul-Petse</span>
                   <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-sm shadow-[0_0_5px_#06b6d4]"></div>
                   <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">Heatmap</span>
                 </div>
              </div>

              {/* Ultra Dense Vertical Bar Heatmap (Matching Reference 2 & 4 exactly) */}
              <div className="flex-1 flex items-end gap-[2px] w-full pl-6 relative">
                 {/* Y-axis faux labels */}
                 <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-600 pb-4">
                    <span>Mon</span>
                    <span>Nov</span>
                    <span>Dec</span>
                    <span>Apr</span>
                    <span>Mon</span>
                 </div>

                 {Array.from({ length: 85 }).map((_, i) => {
                    const height = Math.random() * 90 + 10;
                    const isIntense = Math.random() > 0.85;
                    const isCyan = Math.random() > 0.92;
                    
                    let bg = 'bg-[#1a122e]'; 
                    let shadow = '';
                    if (height > 40) bg = 'bg-[#4c1d95]';
                    if (height > 70) bg = 'bg-[#7e22ce]';
                    if (isIntense) {
                       bg = isCyan ? 'bg-[#06b6d4]' : 'bg-[#a855f7]';
                       shadow = isCyan ? 'shadow-[0_0_8px_#06b6d4]' : 'shadow-[0_0_8px_#a855f7]';
                    }

                    return (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-t-[1px] ${bg} ${shadow} transition-all opacity-90 hover:opacity-100 hover:brightness-150`} 
                        style={{ height: `${height}%` }}
                      />
                    );
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
