'use client'

import { useEffect, useRef } from 'react'
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ListTree, HardDrive, Cpu, ShieldCheck, 
  Menu, FileText
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
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 180;
      particles = [];
      const numParticles = 40; 

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          isCyan: Math.random() > 0.6,
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
          if (dist < 70) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const grad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            grad.addColorStop(0, p.isCyan ? 'rgba(6,182,212,0.5)' : 'rgba(168,85,247,0.5)');
            grad.addColorStop(1, p2.isCyan ? 'rgba(6,182,212,0.5)' : 'rgba(168,85,247,0.5)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8;
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

  return <canvas ref={canvasRef} className="w-full h-full" />;
};


// ─── MAIN DASHBOARD COMPONENT ────────────────────────────────────────────────
export default function OverviewPage() {
  return (
    <div className="relative min-h-screen bg-[#06050a] text-white p-4 md:p-6 lg:p-8 font-sans overflow-hidden">
      
      {/* ── BACKGROUND AMBIANCE ── */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_rgba(168,85,247,0.15)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_rgba(6,182,212,0.1)_0%,_transparent_50%)]" />
        {/* Subtle Matrix/Binary Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-4">
        
        {/* HEADER */}
        <header className="flex flex-col mb-6">
          <Menu className="text-purple-500 mb-4 cursor-pointer hover:text-purple-400 transition" size={24} />
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-[2px] bg-purple-500/80" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">Neural Command</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            System Overview
          </h1>
          <p className="text-gray-500 text-[11px] uppercase tracking-wider mt-1">Real-time diagnostics of your neural vault.</p>
        </header>

        {/* ── TOP GRID STRUCTURE ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Row 1, Col 1: Memories */}
          <div className="bg-[#0f0b18]/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
            <div className="flex items-center gap-3 mb-2">
              <Brain size={20} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            </div>
            <div className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">169</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">Total Memories <span className="text-gray-600">90%</span></div>
          </div>

          {/* Row 1, Col 2: Active Projects */}
          <div className="bg-[#0f0b18]/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
            <div className="flex items-center gap-3 mb-2">
              <Folder size={20} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            </div>
            <div className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">4</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">Active Projects <span className="text-gray-600">90%</span></div>
          </div>

          {/* Row 1, Col 3: Neural Clusters */}
          <div className="bg-[#0b101a]/80 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70" />
            <div className="flex items-center gap-3 mb-2">
              <Hexagon size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
            <div className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">8</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">Neural Clusters <span className="text-gray-600">90%</span></div>
          </div>

          {/* Row 1 & 2, Col 4: Top Labels (Spans 2 rows) */}
          <div className="md:row-span-2 bg-[#0d0914]/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
             <div className="absolute top-4 left-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Top Labels</div>
             <div className="mt-8 mb-4 opacity-30">
                <Tag size={48} className="text-purple-400 stroke-1 -rotate-45 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
             </div>
             <div className="text-[11px] font-black text-purple-400 tracking-wider uppercase mb-1 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
               Awaiting<br/>Classification
             </div>
             <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-2">Initialize tagging protocol</div>
          </div>

          {/* Row 2, Col 1 & 2: Owned Files (Spans 2 columns) */}
          <div className="md:col-span-2 bg-[#0f0b18]/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_20px_rgba(168,85,247,0.08)] relative overflow-hidden flex flex-col justify-center">
             <div className="absolute bottom-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
             <div className="flex items-center gap-3 mb-2">
               <FileText size={20} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
             </div>
             <div className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">169</div>
             <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">Owned Files <span className="text-gray-600">90%</span></div>
          </div>

          {/* Row 2, Col 3: Neural Links */}
          <div className="bg-[#0b101a]/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_20px_rgba(6,182,212,0.1)] relative overflow-hidden flex flex-col justify-center">
             <div className="absolute bottom-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40" />
             <div className="flex items-center gap-3 mb-2">
               <Zap size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
             </div>
             <div className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">175</div>
             <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">Neural Links <span className="text-gray-600">90%</span></div>
          </div>

        </div>

        {/* ── KNOWLEDGE DENSITY GRAPH ── */}
        <div className="bg-[#0c0a14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-visible mt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_30px_rgba(0,0,0,0.5)]">
           <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-purple-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Knowledge Density</span>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-black text-lg flex items-center justify-end gap-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                   +12%
                </div>
                <div className="text-[9px] text-cyan-500 font-black uppercase tracking-widest mt-1">MO/MO GROWTH</div>
              </div>
           </div>

           {/* Floating "Node Intelligence" Panel overlaid on graph */}
           <div className="absolute right-8 md:right-24 top-20 z-20 w-[240px] bg-[#110e1c]/95 border border-purple-500/40 rounded-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8),_0_0_20px_rgba(168,85,247,0.15)] backdrop-blur-md">
              <div className="text-[11px] font-black text-white uppercase tracking-wider mb-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">NODE INTELLIGENCE</div>
              <div className="space-y-1 text-[9px] uppercase tracking-wider font-bold">
                 <div className="text-purple-300">NODE: OMEGA PRINK-9X</div>
                 <div className="text-gray-400 mt-2">MICROPPTION LEVEL: <span className="text-white">OMEGA</span></div>
                 <div className="text-gray-400">STRAPYK MACKO 70: <span className="text-white">35%</span></div>
                 <div className="text-gray-400">DATA. THROUBSIUP: <span className="text-white">4.5 TSLS</span></div>
                 <div className="text-gray-400">EATURES: <span className="text-white">6 GMLUX</span></div>
                 <div className="text-gray-400">SAGDED BOMINEL: <span className="text-white">ARTYFE</span></div>
                 <div className="text-gray-400">LAW ACCESS: <span className="text-white">G.SEA9 A00</span></div>
                 <div className="text-gray-400">LAW ACCESS: <span className="text-white">D3BAIPAY</span></div>
                 <div className="text-gray-400">CDM CLUSTER: <span className="text-white">MCRLHABLE</span></div>
                 <div className="text-gray-400 mt-2">SYNAPSE ACTIVITY</div>
                 {/* Mini sparkline */}
                 <div className="h-4 w-full mt-1">
                    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                       <path d="M0,15 Q10,5 20,10 T40,15 T60,5 T80,18 T100,2" fill="none" stroke="#a855f7" strokeWidth="2" filter="drop-shadow(0 0 2px #a855f7)" />
                    </svg>
                 </div>
              </div>
           </div>

           {/* Custom Graph Representation */}
           <div className="relative h-[220px] w-full mt-4">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                 {[90,75,50,40,20,10,0].map((v,i) => (
                    <div key={i} className="border-b border-white w-full h-0"></div>
                 ))}
              </div>
              
              {/* SVG Glowing Line */}
              <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 220">
                 <defs>
                   <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#06b6d4" />
                   </linearGradient>
                   <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
                      <stop offset="100%" stopColor="rgba(168,85,247,0.0)" />
                   </linearGradient>
                 </defs>
                 
                 {/* Fill Area */}
                 <polygon points="0,220 20,200 150,110 250,120 400,60 500,100 600,40 700,70 800,110 900,90 980,20 1000,220" fill="url(#fillGrad)" />
                 
                 {/* Glowing Line */}
                 <polyline points="0,220 20,200 150,110 250,120 400,60 500,100 600,40 700,70 800,110 900,90 980,20" fill="none" stroke="url(#lineGrad)" strokeWidth="4" style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.8))' }} />

                 {/* Data Points */}
                 {[ [150,110], [250,120], [400,60], [500,100], [600,40], [700,70], [800,110], [900,90], [980,20] ].map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r="5" fill="#fff" stroke="#06b6d4" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,1))' }} />
                 ))}

                 {/* +12% Tooltip over peak */}
                 <g transform="translate(600, 20)">
                    <rect x="-20" y="-15" width="40" height="20" rx="4" fill="#110e1c" stroke="#fff" strokeWidth="0.5" strokeOpacity="0.2"/>
                    <text x="0" y="0" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">+12%</text>
                 </g>
              </svg>
           </div>
           
           {/* X-Axis Labels */}
           <div className="flex justify-between mt-4 text-[9px] font-bold text-gray-500 uppercase px-2">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
           </div>
        </div>

        {/* ── BOTTOM GRID: SCAN / WEB / ACTIVITY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
          
          {/* NEURAL SCAN PANEL */}
          <div className="lg:col-span-3 bg-[#0c0a14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col">
             
             {/* Brain Visualizer */}
             <div className="bg-black/20 rounded-xl p-6 border border-white/5 flex flex-col items-center mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px]" />
                <span className="text-[12px] font-black uppercase text-gray-300 w-full text-left mb-6 tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Neural Scan</span>
                
                <div className="relative mb-6">
                   <Brain size={100} className="text-purple-400 opacity-90 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
                   {/* Scanning rings */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[40%] border border-purple-400/30 rounded-[100%] shadow-[0_0_15px_rgba(168,85,247,0.4)] rotate-[15deg]" />
                </div>
                
                <div className="w-full">
                   <div className="flex justify-between text-[10px] font-mono text-purple-300 mb-2">
                     <span>Scanning: <span className="font-black text-white">84%</span></span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-purple-500 w-[84%] shadow-[0_0_10px_#a855f7]" />
                   </div>
                </div>
             </div>

             {/* Navigation Menu */}
             <nav className="flex-1 flex flex-col space-y-1">
                <button className="relative w-full h-[40px] px-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)] overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
                   <div className="flex items-center gap-3">
                     <Map size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Neural Map</span>
                   </div>
                </button>
                <button className="w-full h-[40px] px-4 flex items-center gap-3 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
                   <ListTree size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Data Streams</span>
                </button>
                <button className="w-full h-[40px] px-4 flex items-center justify-between rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
                   <div className="flex items-center gap-3">
                     <HardDrive size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Core Memories</span>
                   </div>
                   <span className="text-[9px] font-black text-magenta-500 text-[#d946ef] drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">175TB</span>
                </button>
                <button className="w-full h-[40px] px-4 flex items-center gap-3 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
                   <Cpu size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">System Health</span>
                </button>
                <button className="w-full h-[40px] px-4 flex items-center gap-3 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
                   <ShieldCheck size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Security Logs</span>
                </button>
             </nav>
          </div>

          {/* NEURAL WEB CLUSTER PANEL */}
          <div className="lg:col-span-5 bg-[#0c0a14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col relative overflow-hidden">
             <div className="flex items-center gap-2 mb-1 z-10">
               <Hexagon size={16} className="text-purple-400" />
               <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Neural Web Cluster</span>
             </div>
             <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4 z-10">Omega-Prime Cluster</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest z-10 mb-2">Links: <span className="text-white">Active [94]</span></div>
             
             {/* Canvas Container */}
             <div className="flex-1 w-full relative z-0 min-h-[180px]">
                <NeuralWebCluster />
             </div>

             <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1 z-10">
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Node Density: <span className="text-white">High</span></div>
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Synapse Flow: <span className="text-cyan-400">Optimal</span></div>
             </div>
          </div>

          {/* VAULT ACTIVITY PANEL */}
          <div className="lg:col-span-4 bg-[#0c0a14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-10 bg-gradient-to-l from-white/10 to-transparent -skew-x-12 translate-x-4 opacity-50 pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6">
               <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Vault Activity</span>
               <div className="flex items-center gap-2">
                 <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Ortul-Petse</span>
                 <div className="w-1.5 h-1.5 bg-cyan-400 rounded-sm"></div>
                 <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Heatmap</span>
               </div>
            </div>

            {/* Heatmap Grid */}
            <div className="flex-1 flex items-end">
               <div className="w-full aspect-[2/1] grid grid-cols-[repeat(30,1fr)] gap-[1px]">
                 {Array.from({ length: 300 }).map((_, i) => {
                    const row = Math.floor(i / 30);
                    // Generate a random intensity, biased towards bottom middle
                    const active = Math.random() > 0.6;
                    const intense = Math.random() > 0.85;
                    const isCyan = Math.random() > 0.9;
                    
                    let bg = 'bg-[#151525]'; // base dark
                    if (active) bg = 'bg-purple-900/40';
                    if (intense) bg = 'bg-purple-500 shadow-[0_0_5px_#a855f7]';
                    if (isCyan && intense) bg = 'bg-cyan-400 shadow-[0_0_5px_#06b6d4]';

                    return (
                      <div key={i} className={`w-full h-full rounded-[1px] ${bg} transition-colors duration-1000`} />
                    );
                 })}
               </div>
            </div>

            {/* X-axis months */}
            <div className="flex justify-between mt-3 text-[8px] font-bold text-gray-600 uppercase px-1 border-t border-white/10 pt-2">
               {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
