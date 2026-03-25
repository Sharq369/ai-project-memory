'use client'

import { useEffect, useRef } from 'react'
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ListTree, HardDrive, Cpu, ShieldCheck, 
  Menu, FileText, Activity
} from 'lucide-react'

// ─── NEURAL WEB CLUSTER CANVAS (High Density Web) ────────────────────────────
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
      canvas.height = 160;
      particles = [];
      const numParticles = 70; // Increased density

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          isCyan: Math.random() > 0.5,
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
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
          if (dist < 65) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const grad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            grad.addColorStop(0, p.isCyan ? 'rgba(6,182,212,0.4)' : 'rgba(168,85,247,0.4)');
            grad.addColorStop(1, p2.isCyan ? 'rgba(6,182,212,0.4)' : 'rgba(168,85,247,0.4)');
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

  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 z-0" />;
};


// ─── MAIN DASHBOARD COMPONENT ────────────────────────────────────────────────
export default function OverviewPage() {
  return (
    // We add min-w-[800px] and overflow-x-auto so the mobile screen allows side-scrolling the exact desktop layout
    <div className="relative min-h-screen bg-[#050508] text-white p-4 font-sans overflow-x-auto">
      
      {/* ── BACKGROUND AMBIANCE ── */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 min-w-[800px]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_rgba(168,85,247,0.15)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_rgba(6,182,212,0.1)_0%,_transparent_50%)]" />
      </div>

      <div className="relative z-10 w-[800px] lg:w-full max-w-6xl mx-auto space-y-4">
        
        {/* HEADER */}
        <header className="flex flex-col mb-4">
          <Menu className="text-purple-500 mb-4 cursor-pointer hover:text-purple-400 transition" size={20} />
          <div className="flex items-center gap-3 mb-1">
            <div className="w-6 h-[2px] bg-purple-500/80" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-purple-400">Neural Command</span>
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            System Overview
          </h1>
          <p className="text-gray-500 text-[9px] uppercase tracking-wider mt-1">Real-time diagnostics of your neural vault.</p>
        </header>

        {/* ── TOP GRID STRUCTURE (Forced 4-columns) ── */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1.2fr] gap-3">
          
          {/* Row 1, Col 1: Memories */}
          <div className="bg-[#0f0b18]/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />
            <div className="flex items-center gap-2 mb-1">
              <Brain size={16} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            </div>
            <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">169</div>
            <div className="text-[8px] font-black uppercase tracking-wider text-gray-400 mt-1">Total Memories <span className="text-gray-600">90%</span></div>
          </div>

          {/* Row 1, Col 2: Active Projects */}
          <div className="bg-[#0f0b18]/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />
            <div className="flex items-center gap-2 mb-1">
              <Folder size={16} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            </div>
            <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">4</div>
            <div className="text-[8px] font-black uppercase tracking-wider text-gray-400 mt-1">Active Projects <span className="text-gray-600">90%</span></div>
          </div>

          {/* Row 1, Col 3: Neural Clusters */}
          <div className="bg-[#0b101a]/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90" />
            <div className="flex items-center gap-2 mb-1">
              <Hexagon size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
            <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">8</div>
            <div className="text-[8px] font-black uppercase tracking-wider text-gray-400 mt-1">Neural Clusters <span className="text-gray-600">90%</span></div>
          </div>

          {/* Row 1 & 2, Col 4: Top Labels (Spans 2 rows) */}
          <div className="row-span-2 bg-[#0d0914]/90 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
             <div className="absolute top-3 left-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Top Labels</div>
             <div className="mt-6 mb-3 opacity-30 relative">
                <Tag size={36} className="text-purple-400 stroke-1 -rotate-45 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
             </div>
             <div className="text-[10px] font-black text-purple-400 tracking-wider uppercase mb-1 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] leading-tight">
               Awaiting<br/>Classification
             </div>
             <div className="text-[7px] text-gray-500 uppercase tracking-widest mt-1">Initialize tagging protocol</div>
          </div>

          {/* Row 2, Col 1 & 2: Owned Files (Spans 2 columns) */}
          <div className="col-span-2 bg-[#0f0b18]/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_15px_rgba(168,85,247,0.08)] relative overflow-hidden flex flex-col justify-center">
             <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" />
             <div className="flex items-center gap-2 mb-1">
               <FileText size={16} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
             </div>
             <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">169</div>
             <div className="text-[8px] font-black uppercase tracking-wider text-gray-400 mt-1">Owned Files <span className="text-gray-600">90%</span></div>
          </div>

          {/* Row 2, Col 3: Neural Links */}
          <div className="col-span-1 bg-[#0b101a]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden flex flex-col justify-center">
             <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
             <div className="flex items-center gap-2 mb-1">
               <Zap size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
             </div>
             <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">175</div>
             <div className="text-[8px] font-black uppercase tracking-wider text-gray-400 mt-1">Neural Links <span className="text-gray-600">90%</span></div>
          </div>

        </div>

        {/* ── KNOWLEDGE DENSITY GRAPH ── */}
        <div className="bg-[#0c0a14]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5 relative overflow-visible shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_20px_rgba(0,0,0,0.5)]">
           <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Knowledge Density</span>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-black text-sm flex items-center justify-end gap-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                   +12%
                </div>
                <div className="text-[7px] text-cyan-500 font-black uppercase tracking-widest mt-0.5">MO/MO GROWTH</div>
              </div>
           </div>

           {/* Floating "Node Intelligence" Panel */}
           <div className="absolute right-[20%] top-12 z-20 w-[200px] bg-[#110e1c]/95 border border-purple-500/40 rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.9),_0_0_20px_rgba(168,85,247,0.15)] backdrop-blur-md">
              <div className="text-[9px] font-black text-white uppercase tracking-wider mb-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">NODE INTELLIGENCE</div>
              <div className="space-y-1 text-[7px] uppercase tracking-wider font-bold">
                 <div className="text-purple-300">NODE: OMEGA PRINK-9X</div>
                 <div className="text-gray-400 mt-1.5">MICROPPTION LEVEL: <span className="text-white">OMEGA</span></div>
                 <div className="text-gray-400">STRAPYK MACKO 70: <span className="text-white">35%</span></div>
                 <div className="text-gray-400">DATA. THROUBSIUP: <span className="text-white">4.5 TSLS</span></div>
                 <div className="text-gray-400">EATURES: <span className="text-white">6 GMLUX</span></div>
                 <div className="text-gray-400">SAGDED BOMINEL: <span className="text-white">ARTYFE</span></div>
                 <div className="text-gray-400">LAW ACCESS: <span className="text-white">G.SEA9 A00</span></div>
                 <div className="text-gray-400">LAW ACCESS: <span className="text-white">D3BAIPAY</span></div>
                 <div className="text-gray-400">CDM CLUSTER: <span className="text-white">MCRLHABLE</span></div>
                 <div className="text-gray-400 mt-1.5">SYNAPSE ACTIVITY</div>
                 {/* Mini sparkline */}
                 <div className="h-3 w-full mt-1">
                    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                       <path d="M0,15 Q10,5 20,10 T40,15 T60,5 T80,18 T100,2" fill="none" stroke="#06b6d4" strokeWidth="2" filter="drop-shadow(0 0 2px #06b6d4)" />
                    </svg>
                 </div>
              </div>
           </div>

           {/* SVG Graph */}
           <div className="relative h-[160px] w-full mt-2">
              <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                 {[90,75,50,40,20,10,0].map((v,i) => (
                    <div key={i} className="border-b border-white w-full h-0"></div>
                 ))}
              </div>
              
              <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 160">
                 <defs>
                   <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#06b6d4" />
                   </linearGradient>
                   <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(6,182,212,0.2)" />
                      <stop offset="100%" stopColor="rgba(168,85,247,0.0)" />
                   </linearGradient>
                 </defs>
                 
                 <polygon points="0,160 20,140 150,80 250,90 400,40 500,70 600,20 700,50 800,80 900,60 980,10 1000,160" fill="url(#fillGrad)" />
                 <polyline points="0,160 20,140 150,80 250,90 400,40 500,70 600,20 700,50 800,80 900,60 980,10" fill="none" stroke="url(#lineGrad)" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.8))' }} />

                 {[ [150,80], [250,90], [400,40], [500,70], [600,20], [700,50], [800,80], [900,60], [980,10] ].map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r="4" fill="#fff" stroke="#06b6d4" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,1))' }} />
                 ))}
              </svg>
           </div>
           
           <div className="flex justify-between mt-2 text-[7px] font-bold text-gray-500 uppercase px-2">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
           </div>
        </div>

        {/* ── BOTTOM GRID (Forced Side-by-Side: Scan on Left, Web/Vault on Right) ── */}
        <div className="grid grid-cols-[1fr_2fr] gap-4 mt-4">
          
          {/* LEFT: NEURAL SCAN PANEL */}
          <div className="bg-[#0c0a14]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col h-full">
             
             {/* Brain Visualizer */}
             <div className="bg-black/20 rounded-lg p-4 border border-white/5 flex flex-col items-center mb-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[30px]" />
                <span className="text-[10px] font-black uppercase text-gray-300 w-full text-center mb-4 tracking-widest">Neural Scan</span>
                
                <div className="relative mb-5">
                   {/* Purple Glowing Brain */}
                   <Brain size={64} className="text-purple-400 opacity-90 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                   {/* Orbit Ring */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[30%] border-[1.5px] border-purple-400/40 rounded-[100%] shadow-[0_0_10px_rgba(168,85,247,0.5)] rotate-[20deg]" />
                </div>
                
                <div className="w-full">
                   <div className="flex justify-between text-[8px] font-mono text-purple-300 mb-1.5">
                     <span>Scanning: <span className="font-black text-white">84%</span></span>
                   </div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-purple-500 w-[84%] shadow-[0_0_8px_#a855f7]" />
                   </div>
                </div>
             </div>

             {/* Navigation Menu */}
             <nav className="flex flex-col space-y-1 mt-auto">
                <button className="relative w-full h-[32px] px-3 flex items-center justify-between rounded-md bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)] overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                   <div className="flex items-center gap-2">
                     <Map size={12} />
                     <span className="text-[8px] font-black uppercase tracking-widest text-white">Neural Map</span>
                   </div>
                </button>
                <button className="w-full h-[32px] px-3 flex items-center gap-2 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                   <ListTree size={12} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Data Streams</span>
                </button>
                <button className="w-full h-[32px] px-3 flex items-center justify-between rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                   <div className="flex items-center gap-2">
                     <HardDrive size={12} />
                     <span className="text-[8px] font-black uppercase tracking-widest">Core Memories</span>
                   </div>
                   <span className="text-[7px] font-black text-magenta-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">175TB</span>
                </button>
                <button className="w-full h-[32px] px-3 flex items-center gap-2 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                   <Cpu size={12} />
                   <span className="text-[8px] font-black uppercase tracking-widest">System Health</span>
                </button>
                <button className="w-full h-[32px] px-3 flex items-center gap-2 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                   <ShieldCheck size={12} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Security Logs</span>
                </button>
             </nav>
          </div>

          {/* RIGHT COL: WEB CLUSTER & VAULT ACTIVITY */}
          <div className="flex flex-col gap-4 h-full">
            
            {/* NEURAL WEB CLUSTER PANEL */}
            <div className="flex-1 bg-[#0c0a14]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col relative overflow-hidden min-h-[180px]">
               <div className="flex items-center gap-2 mb-1 z-10">
                 <Hexagon size={12} className="text-purple-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Neural Web Cluster</span>
               </div>
               <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-2 z-10">Omega-Prime Cluster</div>
               <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest z-10 mb-2">Links: <span className="text-white">Active [94]</span></div>
               
               <NeuralWebCluster />

               <div className="mt-auto pt-2 border-t border-white/10 flex flex-col gap-1 z-10 relative">
                  <div className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Node Density: <span className="text-white">High</span></div>
                  <div className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Synapse Flow: <span className="text-cyan-400">Optimal</span></div>
               </div>
            </div>

            {/* VAULT ACTIVITY PANEL (Dense Bar Heatmap) */}
            <div className="h-[140px] bg-[#0c0a14]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-8 bg-gradient-to-l from-white/10 to-transparent -skew-x-12 translate-x-2 opacity-30 pointer-events-none" />
              
              <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Vault Activity</span>
                 <div className="flex items-center gap-2">
                   <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">Ortul-Petse</span>
                   <div className="w-1.5 h-1.5 bg-cyan-400 rounded-sm"></div>
                   <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">Heatmap</span>
                 </div>
              </div>

              {/* Vertical Bar Heatmap */}
              <div className="flex-1 flex items-end gap-[2px]">
                 {Array.from({ length: 60 }).map((_, i) => {
                    const height = Math.random() * 100;
                    const isIntense = Math.random() > 0.8;
                    const isCyan = Math.random() > 0.9;
                    
                    let bg = 'bg-purple-900/30';
                    let shadow = '';
                    if (height > 50) bg = 'bg-purple-700/60';
                    if (isIntense) {
                       bg = isCyan ? 'bg-cyan-400' : 'bg-purple-500';
                       shadow = isCyan ? 'shadow-[0_0_8px_#06b6d4]' : 'shadow-[0_0_8px_#a855f7]';
                    }

                    return (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-t-[1px] ${bg} ${shadow} transition-all`} 
                        style={{ height: `${height}%` }}
                      />
                    );
                 })}
              </div>

              <div className="flex justify-between mt-2 text-[6px] font-bold text-gray-600 uppercase border-t border-white/10 pt-1.5">
                 {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
