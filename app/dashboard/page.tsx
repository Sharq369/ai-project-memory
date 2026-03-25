"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ListTree, HardDrive, Cpu, ShieldCheck,
  TrendingUp, Activity, Lock, Search, Menu, Bell
} from 'lucide-react';

// --- Styled Components (Mocking the Cyberpunk Look) ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-5 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${className}`}>
    {/* Inner Glow/Highlight */}
    <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    {children}
  </div>
);

const NeonText = ({ children, color = "cyan" }: { children: React.ReactNode, color?: "cyan" | "purple" | "green" }) => {
  const shadowClass = color === "cyan" ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "drop-shadow-[0_0_8px_rgba(192,38,211,0.8)]";
  return <span className={`font-bold ${shadowClass}`}>{children}</span>;
};

// --- Main Page Component ---

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Ensure animations only run on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full -z-10" />

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-500 font-bold mb-1">Neural Command</p>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">System Overview</h1>
          <p className="text-xs text-slate-500">Real-time diagnostics of your neural vault.</p>
        </div>
        <div className="flex gap-4">
          <button className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
            <Search size={20} className="text-slate-400" />
          </button>
          <button className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors relative">
            <Bell size={20} className="text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Top Row Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="group hover:border-cyan-500/50 transition-all duration-500">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                <Brain size={20} />
              </div>
              <span className="text-[10px] text-slate-500">90%</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tighter">169</h3>
            <p className="text-[10px] uppercase text-slate-500 tracking-widest mt-1">Total Memories</p>
          </Card>

          <Card className="group hover:border-purple-500/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Folder size={20} />
              </div>
              <span className="text-[10px] text-slate-500">90%</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tighter">4</h3>
            <p className="text-[10px] uppercase text-slate-500 tracking-widest mt-1">Active Projects</p>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Hexagon size={20} />
              </div>
              <span className="text-[10px] text-slate-500">90%</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tighter">8</h3>
            <p className="text-[10px] uppercase text-slate-500 tracking-widest mt-1">Neural Clusters</p>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                <Zap size={20} />
              </div>
              <span className="text-[10px] text-slate-500">90%</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tighter">175</h3>
            <p className="text-[10px] uppercase text-slate-500 tracking-widest mt-1">Neural Links</p>
          </Card>

          <Card className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><HardDrive size={18}/></div>
               <div>
                  <h3 className="text-xl font-bold text-white">169</h3>
                  <p className="text-[10px] uppercase text-slate-500 tracking-widest">Owned Files <span className="text-blue-400 ml-2">90%</span></p>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar Widget (Top Labels) */}
        <Card className="lg:row-span-2 flex flex-col items-center justify-center text-center border-dashed">
          <div className="mb-4 opacity-20"><Tag size={48} /></div>
          <p className="text-xs uppercase font-bold tracking-widest text-purple-400 mb-2 italic">Awaiting Classification</p>
          <p className="text-[10px] text-slate-500 max-w-[120px]">Initialize tagging protocol to start your memories.</p>
        </Card>

        {/* Knowledge Density Chart Area */}
        <Card className="lg:col-span-3 min-h-[300px] relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-purple-400" />
              <h3 className="text-[10px] uppercase font-bold tracking-widest">Knowledge Density</h3>
            </div>
            <div className="flex items-center gap-1 text-cyan-400 text-[10px]">
              <TrendingUp size={12} />
              <span className="font-bold">+12% GROWTH</span>
            </div>
          </div>

          {/* Mock Graph Implementation */}
          <div className="h-40 w-full relative flex items-end gap-1">
             <div className="absolute inset-0 grid grid-cols-1 grid-rows-4 w-full h-full">
                {[1,2,3,4].map(i => <div key={i} className="border-t border-white/5 w-full h-full" />)}
             </div>
             {/* Simple SVG Line Graph */}
             <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path 
                d="M0,80 L20,60 L40,75 L60,40 L80,55 L100,10" 
                fill="none" 
                stroke="url(#lineGradient)" 
                strokeWidth="2"
                className="drop-shadow-[0_0_8px_#22d3ee]"
               />
               <defs>
                 <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                   <stop offset="0%" stopColor="#a855f7" />
                   <stop offset="100%" stopColor="#06b6d4" />
                 </linearGradient>
               </defs>
             </svg>
             
             {/* Intelligence Popover */}
             <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 w-48 bg-black/80 border border-cyan-500/30 p-3 rounded backdrop-blur-xl z-10 shadow-2xl">
                <h4 className="text-[9px] uppercase font-black text-white border-b border-white/10 pb-1 mb-2">Node Intelligence</h4>
                <div className="space-y-1 text-[8px] font-mono text-slate-400">
                  <p>NODE: <span className="text-cyan-400 font-bold">OMEGA-PRIME-SX</span></p>
                  <p>ENCRYPTION: <span className="text-white">OMEGA</span></p>
                  <p>SYNAPSE STRENGTH: <span className="text-white">96%</span></p>
                  <p>THROUGHPUT: <span className="text-cyan-400 italic">4.5 TSL/S</span></p>
                </div>
             </div>
          </div>
          
          <div className="flex justify-between mt-4 text-[8px] font-mono text-slate-600 uppercase">
             {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m}>{m}</span>)}
          </div>
        </Card>

        {/* Bottom Grid Components */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <h3 className="text-[10px] uppercase font-bold tracking-widest mb-4">Neural Scan</h3>
            <div className="relative flex flex-col items-center justify-center py-6">
               <div className="relative">
                  <Brain size={64} className="text-purple-500 animate-pulse drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                  <div className="absolute inset-0 border-[1px] border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
               </div>
               <div className="w-full mt-6 space-y-2">
                  <div className="flex justify-between text-[9px] uppercase font-bold">
                    <span className="text-slate-500 italic">Scanning...</span>
                    <span className="text-purple-400">84%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 w-[84%] shadow-[0_0_8px_#22d3ee]" />
                  </div>
               </div>
            </div>

            {/* Sub-menu inside Card */}
            <div className="mt-4 space-y-1 border-t border-white/5 pt-4">
              {[
                {icon: Map, label: 'Neural Map', active: true},
                {icon: Activity, label: 'Data Streams'},
                {icon: Brain, label: 'Core Memories', value: '175TB'},
                {icon: ShieldCheck, label: 'System Health'},
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all ${item.active ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
                   <div className="flex items-center gap-3">
                     <item.icon size={12} />
                     <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                   </div>
                   {item.value && <span className="text-[9px] font-mono text-purple-400 font-bold">{item.value}</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-2">
           <div className="flex items-center gap-2 mb-4">
             <Hexagon size={14} className="text-cyan-400" />
             <h3 className="text-[10px] uppercase font-bold tracking-widest">Neural Web Cluster</h3>
           </div>
           
           <div className="relative h-40 bg-black/20 rounded border border-white/5 overflow-hidden flex items-center justify-center">
              {/* Fake Network Graph Grid */}
              <div className="grid grid-cols-12 gap-px w-full h-full opacity-10">
                {Array.from({length: 48}).map((_, i) => <div key={i} className="border border-white/10" />)}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                 {/* Visual dots & lines to simulate neural net */}
                 <div className="relative w-32 h-32">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-cyan-500/20 rounded-full animate-ping opacity-20" />
                    <Activity size={48} className="text-cyan-400/50 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 </div>
              </div>
              <div className="absolute bottom-3 left-3 text-[8px] font-mono space-y-0.5">
                 <p className="text-slate-400">NODE DENSITY: <span className="text-white">HIGH</span></p>
                 <p className="text-slate-400">SYNAPSE FLOW: <span className="text-cyan-400 italic font-bold">OPTIMAL</span></p>
              </div>
           </div>
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="text-[10px] uppercase font-bold tracking-widest mb-4">Vault Activity</h3>
          <div className="grid grid-cols-12 gap-1">
             {Array.from({length: 48}).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-4 rounded-sm transition-all duration-1000 ${
                    i % 7 === 0 ? 'bg-purple-600 shadow-[0_0_8px_#9333ea]' : 
                    i % 5 === 0 ? 'bg-cyan-600' : 
                    i % 3 === 0 ? 'bg-indigo-900/40' : 'bg-white/5'
                  }`} 
                />
             ))}
          </div>
          <div className="mt-4 flex justify-between text-[7px] font-mono text-slate-600">
             <span>JAN</span>
             <span>DEC</span>
          </div>
        </Card>

      </div>
    </div>
  );
}
