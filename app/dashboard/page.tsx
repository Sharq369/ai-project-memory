"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ShieldCheck, TrendingUp, Activity, 
  Lock, Search, Bell, Database, Radio,
  FileText
} from 'lucide-react';

// --- Types ---
interface StatCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  percentage?: string;
  glowColor: 'fuchsia' | 'cyan' | 'blue' | 'none';
  className?: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  value?: string;
  active?: boolean;
}

// --- Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; glowColor?: 'fuchsia' | 'cyan' | 'none' }> = ({ children, className = '', glowColor = 'none' }) => {
  const topBorderGlows = {
    fuchsia: 'from-transparent via-fuchsia-500 to-transparent shadow-[0_0_15px_rgba(217,70,239,0.3)]',
    cyan: 'from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    none: 'bg-transparent'
  };

  const cardShadows = {
    fuchsia: 'shadow-[0_8px_32px_rgba(217,70,239,0.05)]',
    cyan: 'shadow-[0_8px_32px_rgba(34,211,238,0.05)]',
    none: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/5 bg-[#101024]/60 backdrop-blur-xl p-4 md:p-5 ${cardShadows[glowColor]} ${className}`}>
      {/* Top Edge Neon Light */}
      {glowColor !== 'none' && (
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${topBorderGlows[glowColor]} opacity-80`} />
      )}
      {children}
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, percentage, glowColor, className = '' }) => {
  const iconColors = {
    fuchsia: 'text-fuchsia-500',
    cyan: 'text-cyan-400',
    blue: 'text-blue-500',
    none: 'text-slate-400',
  };

  return (
    <Card glowColor={glowColor === 'blue' ? 'none' : glowColor} className={className}>
      <div className="flex justify-between items-start mb-2">
        <Icon size={22} className={`${iconColors[glowColor]} drop-shadow-[0_0_8px_currentColor]`} strokeWidth={1.5} />
        {percentage && (
          <span className="text-[10px] text-slate-400 font-mono">{percentage}</span>
        )}
      </div>
      <h3 className="text-3xl font-black text-white tracking-tighter mt-1">{value}</h3>
      <p className="text-[9px] uppercase text-slate-400 tracking-[0.15em] mt-1">{label}</p>
    </Card>
  );
};

const NeuralScan: React.FC = () => {
  const scanProgress = 84;

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      <div className="relative">
        <Brain 
          size={72} 
          strokeWidth={1.5}
          className="text-fuchsia-500 animate-pulse" 
          style={{ filter: 'drop-shadow(0 0 15px rgba(217,70,239,0.6))' }}
        />
        <div className="absolute inset-[-10px] border-[1px] border-fuchsia-500/30 rounded-[40%] animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-[-20px] border-[1px] border-cyan-500/10 rounded-[40%] animate-[spin_12s_linear_infinite_reverse]" />
      </div>
      
      <div className="w-full mt-8 space-y-2">
        <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest">
          <span className="text-slate-400">Scanning...</span>
          <span className="text-fuchsia-400">{scanProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#0a0a14] rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 relative"
            style={{ width: `${scanProgress}%` }}
          >
             <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/50 blur-[2px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

const KnowledgeDensityChart: React.FC = () => {
  const dataPoints = [10, 28, 22, 35, 25, 55, 30, 45, 60, 40, 75, 90];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const maxValue = Math.max(...dataPoints);
  const chartHeight = 120;
  const chartWidth = 300;
  
  const pathData = dataPoints.map((value, index) => {
    const x = (index / (dataPoints.length - 1)) * chartWidth;
    const y = chartHeight - (value / maxValue) * chartHeight * 0.8 - 10;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaPath = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="relative h-[200px] w-full mt-4">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between pb-6">
        {[100, 75, 50, 25, 0].map((label, i) => (
          <div key={i} className="flex items-center w-full">
            <span className="text-[8px] text-slate-600 font-mono w-6">{label}%</span>
            <div className="h-px bg-white/5 flex-grow ml-2 border-dashed" />
          </div>
        ))}
      </div>
      
      <svg 
        className="absolute inset-0 w-full h-full pb-6 pl-8 overflow-visible" 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(217, 70, 239, 0.2)" />
            <stop offset="100%" stopColor="rgba(217, 70, 239, 0)" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d946ef" /> {/* Fuchsia */}
            <stop offset="50%" stopColor="#22d3ee" /> {/* Cyan */}
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <path d={areaPath} fill="url(#areaGradient)" />
        
        <path 
          d={pathData} 
          fill="none" 
          stroke="url(#lineGradient)" 
          strokeWidth="2"
          filter="url(#glow)"
        />
        
        {/* Data Points */}
        {dataPoints.map((value, index) => {
          const x = (index / (dataPoints.length - 1)) * chartWidth;
          const y = chartHeight - (value / maxValue) * chartHeight * 0.8 - 10;
          const isPeak = value === maxValue;
          
          return (
            <g key={index}>
              <circle 
                cx={x} 
                cy={y} 
                r={3.5} 
                fill="#101024"
                stroke={isPeak ? '#22d3ee' : '#d946ef'}
                strokeWidth="2"
                filter="url(#glow)"
              />
            </g>
          );
        })}
      </svg>
      
      {/* X-Axis Labels */}
      <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[8px] font-mono text-slate-500 uppercase">
        {months.map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
};

const NeuralNetworkGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    
    // Handle DPI for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const nodes: { x: number; y: number; vx: number; vy: number; radius: number; isCyan: boolean }[] = [];
    const numNodes = 40;

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 1,
        isCyan: Math.random() > 0.5
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            const opacity = (1 - dist / 80) * 0.6;
            ctx.beginPath();
            ctx.strokeStyle = nodes[i].isCyan ? `rgba(34, 211, 238, ${opacity})` : `rgba(217, 70, 239, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = node.isCyan ? '#22d3ee' : '#d946ef';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative h-48 w-full mt-4 bg-gradient-to-br from-white/[0.02] to-transparent rounded-lg border border-white/5 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

const VaultActivityHeatmap: React.FC = () => {
  // Simulating the vertical bar chart seen in the target image
  const totalBars = 60;
  
  return (
    <div className="mt-4">
      <div className="flex items-end justify-between gap-px h-16 w-full">
        {Array.from({ length: totalBars }).map((_, i) => {
          const height = Math.random() * 100;
          const isCyan = Math.random() > 0.85; // Occasional cyan highlight
          const isFuchsia = Math.random() > 0.4 && !isCyan;
          
          let bgColor = 'bg-white/10';
          let shadow = '';
          
          if (isCyan) {
             bgColor = 'bg-cyan-400';
             shadow = 'shadow-[0_0_10px_#22d3ee] z-10';
          } else if (isFuchsia) {
             bgColor = 'bg-fuchsia-500/80';
             shadow = 'shadow-[0_0_5px_rgba(217,70,239,0.5)]';
          } else if (height > 50) {
             bgColor = 'bg-[#312e81]'; // Indigo dark
          }

          return (
            <div 
              key={i} 
              className={`w-full rounded-t-[1px] ${bgColor} ${shadow} transition-all duration-500`}
              style={{ height: `${height}%`, opacity: height < 20 ? 0.3 : 1 }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[8px] font-mono text-slate-600 uppercase mt-2">
        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
      </div>
    </div>
  );
};

const NodeIntelligencePopup: React.FC = () => {
  return (
    <div className="absolute top-12 right-12 w-64 bg-[#0d0d1e]/95 border border-fuchsia-500/30 p-4 rounded-xl backdrop-blur-2xl z-20 shadow-[0_0_40px_rgba(217,70,239,0.15)]">
      <h4 className="text-[10px] uppercase font-black text-white border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
        <Radio size={12} className="text-fuchsia-400" />
        Node Intelligence
      </h4>
      <div className="space-y-2 text-[9px] font-mono tracking-wide">
        <div className="flex justify-between">
          <span className="text-slate-400">NODE:</span>
          <span className="text-cyan-400 font-bold">OMEGA-PRIME-SX</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">MICRO-OPTION LEVEL:</span>
          <span className="text-white">OMEGA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">SYNAPSE MACRO 70:</span>
          <span className="text-white">35%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">DATA THROUGHPUT:</span>
          <span className="text-cyan-400 font-bold">4.5 TSL/S</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">ENTITIES:</span>
          <span className="text-white">6 GMUX</span>
        </div>
      </div>
      {/* Decorative Waveform in Popup */}
      <div className="mt-4 h-6 w-full border-t border-white/10 pt-2 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 100 20" className="w-full h-full stroke-fuchsia-500 stroke-1 fill-none drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]">
           <path d="M0,10 Q10,0 20,10 T40,10 T60,10 T80,10 T100,10" />
        </svg>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuItems: MenuItem[] = [
    { icon: Map, label: 'Neural Map', active: true },
    { icon: Activity, label: 'Data Streams' },
    { icon: Database, label: 'Core Memories', value: '175TB' },
    { icon: ShieldCheck, label: 'System Health' },
    { icon: Lock, label: 'Security Logs' },
  ];

  if (!isMounted) {
    return <div className="min-h-screen bg-[#070714]" />;
  }

  return (
    <div className="min-h-screen bg-[#070714] text-slate-200 p-4 md:p-8 font-sans selection:bg-fuchsia-500/30 overflow-hidden relative">
      
      {/* Background Matrix/Noise Texture Simulation */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`}} />
      
      {/* Deep Ambient Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-900/20 blur-[150px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[150px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
           {/* Hamburger Menu Icon Placeholder */}
           <div className="p-2 cursor-pointer hidden md:block">
             <div className="w-5 h-0.5 bg-fuchsia-500 mb-1.5 shadow-[0_0_8px_#d946ef]" />
             <div className="w-5 h-0.5 bg-fuchsia-500 mb-1.5 shadow-[0_0_8px_#d946ef]" />
             <div className="w-3 h-0.5 bg-fuchsia-500 shadow-[0_0_8px_#d946ef]" />
           </div>
           <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-[1px] w-6 bg-fuchsia-500" />
              <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-bold">Neural Command</p>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">System Overview</h1>
            <p className="text-xs text-slate-500 mt-1">Real-time diagnostics of your neural vault.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto relative z-10">
        
        {/* Top Row Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Brain} value={169} label="Total Memories" percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Folder} value={4} label="Active Projects" percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Hexagon} value={8} label="Neural Clusters" percentage="90%" glowColor="cyan" />
          <StatCard icon={Zap} value={175} label="Neural Links" percentage="90%" glowColor="cyan" />
          <StatCard icon={FileText} value={169} label="Owned Files" percentage="90%" glowColor="fuchsia" className="col-span-2 md:col-span-2" />
        </div>

        {/* Right Sidebar Widget (Top Labels) */}
        <Card className="lg:row-span-2 flex flex-col items-center justify-center text-center !p-8">
          <div className="flex justify-between w-full absolute top-4 left-4 right-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Top Labels</span>
          </div>
          <div className="mt-8 mb-4">
            <Tag size={40} className="text-fuchsia-500/50 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]" strokeWidth={1} />
          </div>
          <p className="text-[11px] uppercase font-bold tracking-widest text-fuchsia-400 mb-2 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]">
            Awaiting<br/>Classification
          </p>
          <p className="text-[9px] text-slate-500 max-w-[120px] leading-relaxed">
            Initialize tagging protocol to start your memories.
          </p>
        </Card>

        {/* Knowledge Density Chart Area */}
        <Card className="lg:col-span-3 pb-8" glowColor="none">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-slate-400 fill-slate-400" />
              <h3 className="text-[11px] uppercase font-bold tracking-widest text-white">Knowledge Density</h3>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                <TrendingUp size={14} strokeWidth={2.5} />
                <span className="font-black text-sm">+12%</span>
              </div>
              <span className="text-[8px] font-bold uppercase text-cyan-500/70 tracking-widest">MoM Growth</span>
            </div>
          </div>

          <KnowledgeDensityChart />
          <NodeIntelligencePopup />
        </Card>

        {/* Bottom Area - Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="!p-0" glowColor="none">
            <div className="p-5 pb-2">
              <h3 className="text-[11px] uppercase font-bold tracking-widest text-white">Neural Scan</h3>
              <NeuralScan />
            </div>

            <div className="space-y-0 pb-4">
              {menuItems.map((item, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between py-3 px-6 cursor-pointer transition-all border-l-2 ${
                    item.active 
                    ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/10 to-transparent' 
                    : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className={`flex items-center gap-3 ${item.active ? 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]' : 'text-slate-400'}`}>
                    <item.icon size={16} strokeWidth={1.5} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
                  </div>
                  {item.value && <span className="text-[10px] font-mono text-fuchsia-500 font-bold drop-shadow-[0_0_5px_#d946ef]">{item.value}</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Area - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card glowColor="none">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hexagon size={14} className="text-fuchsia-500" />
                <h3 className="text-[11px] uppercase font-bold tracking-widest text-white">Neural Web Cluster</h3>
              </div>
            </div>
            <div className="text-[9px] font-bold text-slate-400 mb-1">Omega-Prime Cluster</div>
            <div className="text-[9px] text-slate-500">Links: <span className="text-white">Active [94]</span></div>
            
            <NeuralNetworkGraph />
            
            <div className="flex gap-4 mt-3 text-[9px]">
               <span className="text-slate-500">Node Density: <span className="text-white">High</span></span>
               <span className="text-slate-500">Synapse Flow: <span className="text-white">Optimal</span></span>
            </div>
          </Card>

          <Card glowColor="none">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[11px] uppercase font-bold tracking-widest text-white">Vault Activity</h3>
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-slate-500">
                <span>Orbits-Pulse</span>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
                <span>Heatmap</span>
              </div>
            </div>
            <VaultActivityHeatmap />
          </Card>
        </div>

      </div>
    </div>
  );
}
