"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, HardDrive, ShieldCheck,
  TrendingUp, Activity, Lock, Search, Bell,
  Database, Radio
} from 'lucide-react';

// --- Types ---
interface StatCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  percentage?: string;
  color: 'purple' | 'cyan' | 'blue' | 'emerald';
  className?: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  value?: string;
  active?: boolean;
}

// --- Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${className}`}>
    <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    {children}
  </div>
);

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, percentage, color, className = '' }) => {
  const colorClasses = {
    purple: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-black',
    cyan: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black',
    blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-black',
    emerald: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black',
  };

  const glowColors = {
    purple: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    cyan: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]',
    blue: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    emerald: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]',
  };

  return (
    <Card className={`group transition-all duration-300 hover:border-purple-500/40 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg transition-all duration-300 ${colorClasses[color]} ${glowColors[color]}`}>
          <Icon size={20} />
        </div>
        {percentage && (
          <span className="text-[10px] text-slate-500 font-mono">{percentage}</span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white tracking-tighter">{value}</h3>
      <p className="text-[10px] uppercase text-slate-500 tracking-widest mt-1">{label}</p>
    </Card>
  );
};

const NeuralScan: React.FC = () => {
  const scanProgress = 84;

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <div className="relative">
        <Brain 
          size={64} 
          className="text-purple-500 animate-pulse drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
        />
        <div className="absolute inset-0 border-[1px] border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-2 border-[1px] border-purple-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      </div>
      
      <div className="w-full mt-6 space-y-2">
        <div className="flex justify-between text-[9px] uppercase font-bold">
          <span className="text-slate-500 italic animate-pulse">Scanning...</span>
          <span className="text-purple-400">{scanProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 animate-pulse"
            style={{ width: `${scanProgress}%`, boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)' }}
          />
        </div>
      </div>
    </div>
  );
};

const KnowledgeDensityChart: React.FC = () => {
  const dataPoints = [15, 25, 35, 30, 45, 55, 50, 65, 70, 60, 80, 95];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const maxValue = Math.max(...dataPoints);
  const chartHeight = 100;
  const chartWidth = 100;
  
  const pathData = dataPoints.map((value, index) => {
    const x = (index / (dataPoints.length - 1)) * chartWidth;
    const y = chartHeight - (value / maxValue) * chartHeight * 0.8 - 10;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaPath = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="relative h-48 w-full">
      <div className="absolute inset-0 grid grid-rows-4 w-full h-full">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="border-t border-white/5 w-full h-full" />
        ))}
      </div>
      
      <svg 
        className="absolute inset-0 w-full h-full overflow-visible" 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        
        <path d={areaPath} fill="url(#areaGradient)" className="opacity-50" />
        
        <path 
          d={pathData} 
          fill="none" 
          stroke="url(#lineGradient)" 
          strokeWidth="2"
          className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
        />
        
        {dataPoints.map((value, index) => {
          const x = (index / (dataPoints.length - 1)) * chartWidth;
          const y = chartHeight - (value / maxValue) * chartHeight * 0.8 - 10;
          const isPeak = value === maxValue;
          
          return (
            <g key={index}>
              <circle 
                cx={x} 
                cy={y} 
                r={isPeak ? 4 : 3} 
                fill={isPeak ? '#06b6d4' : '#a855f7'}
                className={isPeak ? 'drop-shadow-[0_0_8px_#06b6d4]' : 'drop-shadow-[0_0_5px_#a855f7]'}
              />
              {isPeak && (
                <text x={x} y={y - 8} textAnchor="middle" fill="#06b6d4" fontSize="6" className="font-mono">
                  +12%
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[7px] font-mono text-slate-600 uppercase">
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

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();

    const nodes: { x: number; y: number; vx: number; vy: number; radius: number; color: string }[] = [];
    const numNodes = 25;
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * Math.PI * 2;
      const radius = 30 + Math.random() * 40;
      nodes.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.7,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 2 + Math.random() * 2,
        color: Math.random() > 0.6 ? '#06b6d4' : '#a855f7'
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 60) {
            const opacity = (1 - dist / 60) * 0.5;
            ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        const dx = node.x - centerX;
        const dy = node.y - centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        if (distFromCenter > 70) {
          node.vx -= dx * 0.001;
          node.vy -= dy * 0.001;
        }

        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 3);
        gradient.addColorStop(0, node.color === '#06b6d4' ? 'rgba(6, 182, 212, 0.6)' : 'rgba(168, 85, 247, 0.6)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative h-40 bg-black/20 rounded border border-white/5 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-12 gap-px w-full h-full opacity-10">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="border border-white/10" />
        ))}
      </div>
      
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" />
      </div>
      
      <div className="absolute bottom-3 left-3 text-[8px] font-mono space-y-0.5">
        <p className="text-slate-400">NODE DENSITY: <span className="text-white font-bold">HIGH</span></p>
        <p className="text-slate-400">SYNAPSE FLOW: <span className="text-cyan-400 italic font-bold">OPTIMAL</span></p>
      </div>
      
      <div className="absolute top-2 right-2 flex gap-1">
        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse delay-75" />
      </div>
    </div>
  );
};

const VaultActivityHeatmap: React.FC = () => {
  const totalCells = 48;

  const getIntensity = (index: number) => {
    const patterns = [0, 1, 2, 3, 0, 2, 3, 1, 0, 2, 3, 3, 1, 2, 0, 3, 2, 1, 3, 0, 2, 1, 3, 2, 0, 1, 2, 3, 1, 3, 2, 0, 1, 3, 2, 1, 0, 2, 3, 1, 2, 0, 3, 1, 2, 3, 0, 1];
    return patterns[index % patterns.length];
  };

  const intensityClasses = [
    'bg-white/5',
    'bg-indigo-900/40',
    'bg-cyan-600/60',
    'bg-purple-600 shadow-[0_0_8px_#9333ea]'
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: totalCells }).map((_, i) => {
          const intensity = getIntensity(i);
          return (
            <div 
              key={i} 
              className={`h-3 rounded-sm transition-all duration-500 ${intensityClasses[intensity]}`}
              style={{ animationDelay: `${i * 20}ms` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[7px] font-mono text-slate-600 uppercase">
        <span>JAN</span>
        <span>DEC</span>
      </div>
    </div>
  );
};

const NodeIntelligencePopup: React.FC = () => {
  return (
    <div className="absolute top-4 right-4 w-52 bg-black/90 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-xl z-20 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
      <h4 className="text-[9px] uppercase font-black text-white border-b border-white/10 pb-1.5 mb-2 flex items-center gap-2">
        <Radio size={10} className="text-cyan-400" />
        Node Intelligence
      </h4>
      <div className="space-y-1 text-[8px] font-mono">
        <div className="flex justify-between">
          <span className="text-slate-500">NODE:</span>
          <span className="text-cyan-400 font-bold">OMEGA-PRIME-SX</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">ENCRYPTION:</span>
          <span className="text-white">OMEGA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">SYNAPSE STRENGTH:</span>
          <span className="text-white">96%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">THROUGHPUT:</span>
          <span className="text-cyan-400 italic font-bold">4.5 TSL/S</span>
        </div>
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
    return <div className="min-h-screen bg-[#050505]" />;
  }

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
          <StatCard icon={Brain} value={169} label="Total Memories" percentage="90%" color="purple" />
          <StatCard icon={Folder} value={4} label="Active Projects" percentage="90%" color="cyan" />
          <StatCard icon={Hexagon} value={8} label="Neural Clusters" percentage="90%" color="emerald" />
          <StatCard icon={Zap} value={175} label="Neural Links" percentage="90%" color="purple" />
          <StatCard icon={HardDrive} value={169} label="Owned Files" percentage="90%" color="blue" className="col-span-2 md:col-span-2" />
        </div>

        {/* Right Sidebar Widget (Top Labels) */}
        <Card className="lg:row-span-2 flex flex-col items-center justify-center text-center border-dashed">
          <div className="mb-4 opacity-20">
            <Tag size={48} className="text-purple-400" />
          </div>
          <p className="text-xs uppercase font-bold tracking-widest text-purple-400 mb-2 italic drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
            Awaiting Classification
          </p>
          <p className="text-[10px] text-slate-500 max-w-[120px]">
            Initialize tagging protocol to start your memories.
          </p>
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

          <KnowledgeDensityChart />
          
          <NodeIntelligencePopup />
        </Card>

        {/* Bottom Grid Components */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <h3 className="text-[10px] uppercase font-bold tracking-widest mb-4">Neural Scan</h3>
            
            <NeuralScan />

            <div className="mt-4 space-y-1 border-t border-white/5 pt-4">
              {menuItems.map((item, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
                    item.active ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
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
          
          <NeuralNetworkGraph />
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="text-[10px] uppercase font-bold tracking-widest mb-4">Vault Activity</h3>
          <VaultActivityHeatmap />
        </Card>

      </div>
    </div>
  );
}
