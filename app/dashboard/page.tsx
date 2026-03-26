"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, Activity, Database, TrendingUp
} from 'lucide-react';

// --- 1. Premium Card Component with Sharp Edge Lighting ---
const Card: React.FC<{ children: React.ReactNode; className?: string; glowColor?: 'fuchsia' | 'cyan' | 'none' }> = ({ children, className = '', glowColor = 'none' }) => {
  const edgeGlows = {
    fuchsia: 'bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-[0_2px_20px_-2px_rgba(217,70,239,0.7)]',
    cyan: 'bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_2px_20px_-2px_rgba(34,211,238,0.7)]',
    none: 'bg-transparent'
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-[#1a1a3a] bg-[#0b0b16]/80 backdrop-blur-xl p-5 shadow-2xl ${className}`}>
      {glowColor !== 'none' && (
        <>
          {/* Intense top rim light */}
          <div className={`absolute top-0 left-0 right-0 h-[1px] ${edgeGlows[glowColor]} opacity-100`} />
          {/* Subtle inner border to simulate glass thickness */}
          <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none" />
        </>
      )}
      {children}
    </div>
  );
};

// --- 2. Upgraded Stat Cards ---
const StatCard: React.FC<{ icon: any, value: any, label: string, percentage?: string, glowColor: 'fuchsia' | 'cyan' }> = ({ icon: Icon, value, label, percentage, glowColor }) => (
  <Card glowColor={glowColor}>
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg bg-${glowColor}-500/10 border border-${glowColor}-500/20`}>
        <Icon size={18} className={glowColor === 'fuchsia' ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'} />
      </div>
      {percentage && <span className="text-[10px] text-slate-400 font-mono">{percentage}</span>}
    </div>
    <h3 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{value}</h3>
    <p className="text-[9px] uppercase text-slate-400 tracking-widest mt-1">{label}</p>
  </Card>
);

// --- 3. Fake 3D Holographic Brain (No Three.js needed) ---
const NeuralScan: React.FC = () => {
  const scanProgress = 84;

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      <div className="relative w-[140px] h-[140px] flex items-center justify-center">
        {/* Ambient background bloom */}
        <div className="absolute w-[90px] h-[90px] bg-fuchsia-600/30 blur-[25px] rounded-full mix-blend-screen" />

        {/* The Holographic Brain Stack */}
        <div className="relative animate-pulse flex items-center justify-center">
          <Brain size={68} className="absolute text-[#2a0a4a] blur-[2px] translate-y-[4px]" strokeWidth={2} />
          <Brain size={68} className="absolute text-fuchsia-600 blur-[8px] mix-blend-plus-lighter opacity-90" strokeWidth={1.5} />
          <Brain size={68} className="absolute text-fuchsia-400 blur-[2px] mix-blend-plus-lighter" strokeWidth={1.5} />
          <Brain size={68} className="relative text-[#ffccff] drop-shadow-[0_0_4px_#ffffff]" strokeWidth={1.5} />
        </div>

        {/* Sharp rings */}
        <div className="absolute inset-[10px] border-t-2 border-l border-fuchsia-400/60 rounded-full animate-[spin_3s_cubic-bezier(0.4,0,0.2,1)_infinite] shadow-[0_0_15px_rgba(217,70,239,0.4)]" />
        <div className="absolute inset-[-2px] border-b border-r border-cyan-400/40 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
      </div>

      <div className="w-full mt-8 space-y-2">
        <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
          <span className="text-slate-400">Scanning...</span>
          <span className="text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]">{scanProgress}%</span>
        </div>
        <div className="w-full h-[4px] bg-[#05050a] rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] border border-white/5">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-[#ffffff] relative shadow-[0_0_10px_rgba(217,70,239,1)]" style={{ width: `${scanProgress}%` }}>
            <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent mix-blend-overlay" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. High-Fidelity Neon Line Chart ---
const KnowledgeDensityChart: React.FC = () => {
  // SVG coordinates to simulate the data curve
  const points = "0,250 150,200 300,220 450,120 600,180 750,80 900,100 1000,40";
  const nodes = points.split(' ').map(p => p.split(',').map(Number));

  return (
    <div className="relative w-full h-[220px] mt-6 bg-[#030308] rounded-lg border border-white/5 overflow-hidden flex items-end">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      <svg viewBox="0 0 1000 300" className="w-full h-full absolute inset-0 preserve-3d" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
            <stop offset="100%" stopColor="rgba(217,70,239,0)" />
          </linearGradient>
        </defs>
        
        {/* Fill beneath line */}
        <polygon points={`0,300 ${points} 1000,300`} fill="url(#fade)" />
        
        {/* The Neon Line Stack */}
        <polyline points={points} fill="none" stroke="rgba(217,70,239,0.4)" strokeWidth="25" className="blur-[12px] mix-blend-screen" />
        <polyline points={points} fill="none" stroke="rgba(34,211,238,0.8)" strokeWidth="8" className="blur-[4px] mix-blend-screen" />
        <polyline points={points} fill="none" stroke="#ffffff" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />

        {/* Data Nodes */}
        {nodes.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="12" fill="rgba(34,211,238,0.2)" className="blur-[4px]" />
            <circle cx={x} cy={y} r="4" fill="#ffffff" className="drop-shadow-[0_0_6px_#22d3ee]" />
          </g>
        ))}
      </svg>
      
      {/* Floating Tooltip Mockup */}
      <div className="absolute right-[15%] top-[20%] bg-[#0b0b16]/90 backdrop-blur-md border border-fuchsia-500/30 p-3 rounded-lg shadow-[0_0_20px_rgba(217,70,239,0.2)]">
        <h4 className="text-[9px] uppercase font-black text-white tracking-widest mb-2 flex items-center gap-2">
          <Activity size={12} className="text-cyan-400" /> Node Intelligence
        </h4>
        <div className="space-y-1">
           <p className="text-[8px] text-slate-400 uppercase flex justify-between gap-6"><span>Node:</span> <span className="text-white font-mono">Omega-Prime</span></p>
           <p className="text-[8px] text-slate-400 uppercase flex justify-between gap-6"><span>Throughput:</span> <span className="text-cyan-400 font-mono">4.5 TSL/s</span></p>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Layout ---
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-screen bg-[#030308]" />;

  return (
    <div className="min-h-screen bg-[#030308] text-slate-200 p-4 md:p-8 font-sans selection:bg-fuchsia-500/30">
      
      {/* Ambient background grading */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(217,70,239,0.03),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.03),transparent_40%)] pointer-events-none" />

      <header className="mb-8 max-w-7xl mx-auto flex items-center gap-4">
        <div className="h-10 w-1 bg-gradient-to-b from-cyan-400 to-fuchsia-600 shadow-[0_0_15px_#d946ef]" />
        <div>
          <p className="text-[9px] text-fuchsia-500 font-bold uppercase tracking-[0.2em] mb-1">Neural Command</p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-md">System Overview</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-7xl mx-auto relative z-10">
        
        {/* Top Stats Grid */}
        <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Brain} value={169} label="Total Memories" percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Folder} value={4} label="Active Projects" percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Hexagon} value={8} label="Neural Clusters" percentage="90%" glowColor="cyan" />
          <StatCard icon={Zap} value={175} label="Neural Links" percentage="90%" glowColor="cyan" />
        </div>

        {/* Top Right Label */}
        <div className="xl:col-span-1">
          <Card className="h-full flex flex-col items-center justify-center text-center p-6 border-fuchsia-500/20">
            <Tag size={32} className="text-fuchsia-500 mb-3 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
            <h3 className="text-fuchsia-400 font-black uppercase text-[11px] tracking-widest">Awaiting Classification</h3>
            <p className="text-[9px] text-slate-500 mt-2 tracking-wide">Initialize tagging protocol.</p>
          </Card>
        </div>

        {/* Center Content: Knowledge Density Chart */}
        <div className="xl:col-span-3">
          <Card glowColor="fuchsia">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] flex items-center gap-2 uppercase font-black text-white tracking-widest">
                <Zap size={14} className="text-fuchsia-400" /> Knowledge Density
              </h3>
              <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                <TrendingUp size={12} /> +12% Growth
              </span>
            </div>
            <KnowledgeDensityChart />
          </Card>
        </div>

        {/* Sidebar Navigation & Scan */}
        <div className="xl:col-span-1 row-start-2 xl:row-start-auto space-y-6">
          <Card glowColor="none" className="!p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-[#101024]/50 to-transparent">
              <h3 className="text-[11px] uppercase font-black text-white tracking-widest">Neural Scan</h3>
              <NeuralScan />
            </div>
            <nav className="flex flex-col">
              {[
                { icon: Map, label: 'Neural Map', active: true },
                { icon: Activity, label: 'Data Streams' },
                { icon: Database, label: 'Core Memories', val: '175TB' }
              ].map((item, i) => (
                <div key={i} className={`p-4 flex justify-between items-center border-l-[3px] transition-all cursor-pointer hover:bg-white/[0.02] ${item.active ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-transparent text-slate-400'}`}>
                  <div className="flex items-center gap-3">
                    <item.icon size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                  </div>
                  {item.val && <span className="text-[10px] font-mono font-bold text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">{item.val}</span>}
                </div>
              ))}
            </nav>
          </Card>
        </div>

      </div>
    </div>
  );
}
