"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ShieldCheck, TrendingUp, Activity, 
  Lock, Database, Radio, FileText
} from 'lucide-react';

// --- Improved Brain Glow Hook (Mobile Optimized) ---
const useBrainGlow = (ref: React.RefObject<HTMLCanvasElement>) => {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const dpr = window.devicePixelRatio || 1;

    const blobs = Array.from({ length: 8 }).map(() => ({
      baseX: Math.random(),
      baseY: Math.random(),
      r: Math.random() * 30 + 15,
      speedX: Math.random() * 0.0008 + 0.0004,
      speedY: Math.random() * 0.0008 + 0.0004,
      offset: Math.random() * Math.PI * 2
    }));

    const resize = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = (time: number) => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      blobs.forEach(blob => {
        const x = (blob.baseX + Math.sin(time * blob.speedX + blob.offset) * 0.2) * width;
        const y = (blob.baseY + Math.cos(time * blob.speedY + blob.offset) * 0.2) * height;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.r);
        gradient.addColorStop(0, "rgba(217,70,239,0.7)"); 
        gradient.addColorStop(0.5, "rgba(34,211,238,0.3)"); 
        gradient.addColorStop(1, "rgba(0,0,0,0)"); 

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [ref]);
};

// --- UI Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; glowColor?: 'fuchsia' | 'cyan' | 'none' }> = ({ children, className = '', glowColor = 'none' }) => {
  const topBorderGlows = {
    fuchsia: 'from-transparent via-fuchsia-500 to-transparent shadow-[0_0_15px_rgba(217,70,239,0.3)]',
    cyan: 'from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    none: 'bg-transparent'
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/5 bg-[#101024]/60 backdrop-blur-xl p-5 ${className}`}>
      {glowColor !== 'none' && (
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${topBorderGlows[glowColor]} opacity-80`} />
      )}
      {children}
    </div>
  );
};

const StatCard: React.FC<{ icon: any, value: any, label: string, percentage?: string, glowColor: any }> = ({ icon: Icon, value, label, percentage, glowColor }) => (
  <Card glowColor={glowColor === 'blue' ? 'none' : glowColor}>
    <div className="flex justify-between items-start mb-2">
      <Icon size={20} className={glowColor === 'fuchsia' ? 'text-fuchsia-500' : 'text-cyan-400'} />
      {percentage && <span className="text-[10px] text-slate-400 font-mono">{percentage}</span>}
    </div>
    <h3 className="text-2xl font-black text-white tracking-tighter">{value}</h3>
    <p className="text-[9px] uppercase text-slate-400 tracking-widest mt-1">{label}</p>
  </Card>
);

const NeuralScan: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useBrainGlow(canvasRef);

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <div className="relative w-[140px] h-[140px] flex items-center justify-center">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-full opacity-60" />
        <Brain size={52} strokeWidth={1.5} className="text-fuchsia-400 animate-pulse relative z-10" />
        <div className="absolute inset-[5px] border border-fuchsia-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-[-5px] border border-cyan-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      </div>
      <div className="w-full mt-6 space-y-2">
        <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest">
          <span className="text-slate-400">Scanning...</span>
          <span className="text-fuchsia-400">84%</span>
        </div>
        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 w-[84%]" />
        </div>
      </div>
    </div>
  );
};

const NeuralNetworkGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    
    let width = 0, height = 0, animationId = 0;
    const nodes: any[] = [];

    const init = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      
      nodes.length = 0;
      for (let i = 0; i < 80; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          color: Math.random() > 0.5 ? '217, 70, 239' : '34, 211, 238'
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      
      nodes.forEach((n, i) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const dx = n.x - nodes[j].x, dy = n.y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${n.color}, ${1 - dist/60})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      });
      animationId = requestAnimationFrame(render);
    };

    init();
    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-40 mt-4 bg-black/20 rounded-lg" />;
};

// --- Main Page ---

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-screen bg-[#070714]" />;

  return (
    <div className="min-h-screen bg-[#070714] text-slate-200 p-4 md:p-8 font-sans overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,70,239,0.05),transparent),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.05),transparent)] pointer-events-none" />

      <header className="mb-8 max-w-7xl mx-auto flex items-center gap-4">
        <div className="h-10 w-1 bg-fuchsia-600 shadow-[0_0_10px_#d946ef]" />
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">System Overview</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Neural Command Center v2.0</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        
        {/* Stats Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Brain} value={169} label="Memories" percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Folder} value={4} label="Projects" percentage="Active" glowColor="fuchsia" />
          <StatCard icon={Hexagon} value={8} label="Clusters" percentage="Stable" glowColor="cyan" />
          <StatCard icon={Zap} value={175} label="Links" percentage="Fast" glowColor="cyan" />
        </div>

        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <Card glowColor="none" className="!p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-[10px] uppercase font-black text-white tracking-widest">Neural Scan</h3>
              <NeuralScan />
            </div>
            <nav className="flex flex-col">
              {[
                { icon: Map, label: 'Neural Map', active: true },
                { icon: Activity, label: 'Data Streams' },
                { icon: Database, label: 'Core Memories', val: '175TB' }
              ].map((item, i) => (
                <div key={i} className={`p-4 flex justify-between items-center border-l-2 transition-all ${item.active ? 'border-cyan-400 bg-cyan-400/5 text-cyan-400' : 'border-transparent text-slate-400'}`}>
                  <div className="flex items-center gap-3">
                    <item.icon size={16} />
                    <span className="text-[10px] font-bold uppercase">{item.label}</span>
                  </div>
                  {item.val && <span className="text-[10px] font-mono text-fuchsia-500">{item.val}</span>}
                </div>
              ))}
            </nav>
          </Card>
        </div>

        {/* Center Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] uppercase font-black text-white tracking-widest">Neural Web Cluster</h3>
              <span className="text-[9px] text-cyan-400 font-mono">Status: Optimal</span>
            </div>
            <NeuralNetworkGraph />
          </Card>

          <Card>
             <h3 className="text-[10px] uppercase font-black text-white tracking-widest mb-4">Vault Heatmap</h3>
             <div className="flex items-end gap-1 h-20">
                {Array.from({length: 40}).map((_, i) => (
                  <div key={i} className="flex-1 bg-fuchsia-500/20 rounded-t-sm hover:bg-fuchsia-500 transition-colors" style={{height: `${Math.random() * 100}%`}} />
                ))}
             </div>
          </Card>
        </div>

        {/* Right Label Widget */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col items-center justify-center text-center p-8">
            <Tag size={40} className="text-fuchsia-500/30 mb-4" />
            <h3 className="text-fuchsia-400 font-bold uppercase text-xs tracking-widest">Awaiting Classification</h3>
            <p className="text-[10px] text-slate-500 mt-2">Initialize tagging protocol to organize neural data.</p>
          </Card>
        </div>

      </div>
    </div>
  );
}
