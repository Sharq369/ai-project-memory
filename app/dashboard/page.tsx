"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr'
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, ShieldCheck, TrendingUp, Activity, 
  Lock, Database, Radio,
  FileText, ListTree
} from 'lucide-react';

// ─── CUSTOM GLOWING BRAIN SVG ─────────────────────────────────────────────────
// Matches the reference image: anatomical brain, purple glow, orbital ring, light rays
const GlowingBrainSVG = () => (
  <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
    {/* Outer radial glow burst — the light rays behind the brain */}
    <div style={{
      position: 'absolute', inset: 0, borderRadius: '50%',
      background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(217,70,239,0.35) 0%, rgba(168,85,247,0.2) 30%, transparent 70%)',
      filter: 'blur(8px)',
    }} />
    {/* Secondary glow layer */}
    <div style={{
      position: 'absolute', inset: -10, borderRadius: '50%',
      background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(217,70,239,0.15) 0%, transparent 65%)',
      filter: 'blur(12px)',
    }} />

    {/* Orbital ring — tilted ellipse like in the image */}
    <div style={{
      position: 'absolute',
      width: '160%', height: '35%',
      border: '1px solid rgba(217,70,239,0.55)',
      borderRadius: '100%',
      boxShadow: '0 0 12px rgba(217,70,239,0.4), inset 0 0 8px rgba(217,70,239,0.1)',
      transform: 'rotate(15deg)',
      top: '33%', left: '-30%',
    }} />

    {/* The Brain SVG — detailed anatomical path */}
    <svg
      viewBox="0 0 100 85"
      style={{
        width: 82, height: 70,
        position: 'relative', zIndex: 2,
        filter: 'drop-shadow(0 0 10px rgba(217,70,239,0.9)) drop-shadow(0 0 20px rgba(168,85,247,0.6)) drop-shadow(0 0 35px rgba(217,70,239,0.3))',
      }}
    >
      <defs>
        <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="35%" stopColor="#e879f9" />
          <stop offset="65%" stopColor="#c026d3" />
          <stop offset="100%" stopColor="#a21caf" />
        </linearGradient>
        <linearGradient id="brainGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e879f9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.7" />
        </linearGradient>
        <filter id="brainGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Left hemisphere — outer shape */}
      <path
        d="M 50 75
           C 48 75, 38 74, 30 70
           C 20 65, 12 58, 8 48
           C 4 38, 5 26, 10 18
           C 15 10, 24 5, 33 4
           C 40 3, 46 6, 50 10"
        fill="none" stroke="url(#brainGrad)" strokeWidth="2.5"
        strokeLinecap="round" filter="url(#brainGlow)"
      />
      {/* Left hemisphere — inner folds */}
      <path
        d="M 18 22 C 22 16, 30 14, 36 18
           M 12 36 C 16 30, 24 28, 30 32
           M 14 50 C 20 44, 28 44, 32 50
           M 20 63 C 26 58, 34 58, 38 62"
        fill="none" stroke="url(#brainGrad)" strokeWidth="1.8"
        strokeLinecap="round" opacity="0.85" filter="url(#brainGlow)"
      />
      {/* Left lobe top bump */}
      <path
        d="M 26 6 C 20 2, 12 6, 10 14"
        fill="none" stroke="url(#brainGrad)" strokeWidth="2.2"
        strokeLinecap="round" filter="url(#brainGlow)"
      />

      {/* Right hemisphere — outer shape */}
      <path
        d="M 50 10
           C 54 6, 60 3, 67 4
           C 76 5, 85 10, 90 18
           C 95 26, 96 38, 92 48
           C 88 58, 80 65, 70 70
           C 62 74, 52 75, 50 75"
        fill="none" stroke="url(#brainGrad2)" strokeWidth="2.5"
        strokeLinecap="round" filter="url(#brainGlow)"
      />
      {/* Right hemisphere — inner folds */}
      <path
        d="M 82 22 C 78 16, 70 14, 64 18
           M 88 36 C 84 30, 76 28, 70 32
           M 86 50 C 80 44, 72 44, 68 50
           M 80 63 C 74 58, 66 58, 62 62"
        fill="none" stroke="url(#brainGrad2)" strokeWidth="1.8"
        strokeLinecap="round" opacity="0.85" filter="url(#brainGlow)"
      />
      {/* Right lobe top bump */}
      <path
        d="M 74 6 C 80 2, 88 6, 90 14"
        fill="none" stroke="url(#brainGrad2)" strokeWidth="2.2"
        strokeLinecap="round" filter="url(#brainGlow)"
      />

      {/* Center divide */}
      <path
        d="M 50 10 C 49 20, 49 30, 50 40 C 51 50, 51 62, 50 75"
        fill="none" stroke="rgba(217,70,239,0.5)" strokeWidth="1"
        strokeLinecap="round" strokeDasharray="2,2"
      />

      {/* Brain stem */}
      <path
        d="M 44 75 C 43 80, 44 84, 50 84 C 56 84, 57 80, 56 75"
        fill="none" stroke="url(#brainGrad)" strokeWidth="2"
        strokeLinecap="round" filter="url(#brainGlow)"
      />

      {/* Highlight spots — white hot points */}
      <circle cx="28" cy="20" r="1.5" fill="rgba(255,255,255,0.8)" filter="url(#brainGlow)" />
      <circle cx="72" cy="20" r="1.5" fill="rgba(255,255,255,0.8)" filter="url(#brainGlow)" />
      <circle cx="50" cy="15" r="1" fill="rgba(255,255,255,0.6)" />
    </svg>
  </div>
)

// ─── TYPES ────────────────────────────────────────────────────────────────────
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

// ─── CARD ─────────────────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string; glowColor?: 'fuchsia' | 'cyan' | 'none' }> = ({ children, className = '', glowColor = 'none' }) => {
  const topBorderGlows = {
    fuchsia: 'from-transparent via-fuchsia-500 to-transparent',
    cyan: 'from-transparent via-cyan-400 to-transparent',
    none: 'bg-transparent'
  };
  const cardShadows = {
    fuchsia: 'shadow-[0_8px_32px_rgba(217,70,239,0.05)]',
    cyan: 'shadow-[0_8px_32px_rgba(34,211,238,0.05)]',
    none: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
  };
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/5 bg-[#101024]/60 backdrop-blur-xl p-4 md:p-5 ${cardShadows[glowColor]} ${className}`}>
      {glowColor !== 'none' && (
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${topBorderGlows[glowColor]} opacity-80`} />
      )}
      {children}
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
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
        {percentage && <span className="text-[10px] text-slate-400 font-mono">{percentage}</span>}
      </div>
      <h3 className="text-3xl font-black text-white tracking-tighter mt-1">{value}</h3>
      <p className="text-[9px] uppercase text-slate-400 tracking-[0.15em] mt-1">{label}</p>
    </Card>
  );
};

// ─── NEURAL SCAN ──────────────────────────────────────────────────────────────
// FIX: replaced Lucide Brain icon with custom GlowingBrainSVG matching reference image
const NeuralScan: React.FC = () => {
  const scanProgress = 84;
  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      <GlowingBrainSVG />
      <div className="w-full mt-6 space-y-2">
        <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest">
          <span className="text-slate-400">Scanning:</span>
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

// ─── KNOWLEDGE DENSITY CHART ──────────────────────────────────────────────────
const KnowledgeDensityChart: React.FC = () => {
  const dataPoints = [10, 28, 22, 35, 25, 55, 30, 45, 60, 40, 75, 90];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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
      <div className="absolute inset-0 flex flex-col justify-between pb-6">
        {[100,75,50,25,0].map((label, i) => (
          <div key={i} className="flex items-center w-full">
            <span className="text-[8px] text-slate-600 font-mono w-6">{label}%</span>
            <div className="h-px bg-white/5 flex-grow ml-2 border-dashed" />
          </div>
        ))}
      </div>
      <svg className="absolute inset-0 w-full h-full pb-6 pl-8 overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(217,70,239,0.2)" />
            <stop offset="100%" stopColor="rgba(217,70,239,0)" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d946ef" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={pathData} fill="none" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" />
        {dataPoints.map((value, index) => {
          const x = (index / (dataPoints.length - 1)) * chartWidth;
          const y = chartHeight - (value / maxValue) * chartHeight * 0.8 - 10;
          const isPeak = value === maxValue;
          return (
            <g key={index}>
              <circle cx={x} cy={y} r={3.5} fill="#101024" stroke={isPeak ? '#22d3ee' : '#d946ef'} strokeWidth="2" filter="url(#glow)" />
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[8px] font-mono text-slate-500 uppercase">
        {months.map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
};

// ─── NEURAL NETWORK GRAPH ─────────────────────────────────────────────────────
const NeuralNetworkGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const numNodes = 120;
    const maxDistance = 75;
    const nodes: any[] = [];
    const centerX = width / 2, centerY = height / 2;
    const clusterRadiusX = width * 0.4, clusterRadiusY = height * 0.35;

    for (let i = 0; i < numNodes; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusDist = Math.random();
      const rX = Math.pow(radiusDist, 1.5) * clusterRadiusX;
      const rY = Math.pow(radiusDist, 1.5) * clusterRadiusY;
      const baseX = centerX + Math.cos(angle) * rX;
      const baseY = centerY + Math.sin(angle) * rY;
      const colorRoll = Math.random();
      let colorStr = '', rgbStr = '';
      if (colorRoll > 0.9) { colorStr = '#ffffff'; rgbStr = '255,255,255'; }
      else if (colorRoll > 0.6) { colorStr = '#22d3ee'; rgbStr = '34,211,238'; }
      else if (colorRoll > 0.3) { colorStr = '#d946ef'; rgbStr = '217,70,239'; }
      else { colorStr = '#4f46e5'; rgbStr = '79,70,229'; }
      nodes.push({ baseX, baseY, x: baseX, y: baseY, orbitAngle: Math.random() * Math.PI * 2, orbitRadius: Math.random() * 8 + 2, orbitSpeed: (Math.random() - 0.5) * 0.02, radius: Math.random() * 1.5 + 0.5, color: colorStr, rgb: rgbStr });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const opacity = (1 - dist / maxDistance) * 0.8;
            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            grad.addColorStop(0, `rgba(${nodes[i].rgb},${opacity})`);
            grad.addColorStop(1, `rgba(${nodes[j].rgb},${opacity})`);
            ctx.beginPath(); ctx.strokeStyle = grad; ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      }
      nodes.forEach(node => {
        node.orbitAngle += node.orbitSpeed;
        node.x = node.baseX + Math.cos(node.orbitAngle) * node.orbitRadius;
        node.y = node.baseY + Math.sin(node.orbitAngle) * node.orbitRadius;
        ctx.beginPath(); ctx.fillStyle = node.color;
        ctx.shadowBlur = node.color === '#ffffff' ? 15 : 5;
        ctx.shadowColor = node.color === '#ffffff' ? '#22d3ee' : node.color;
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalCompositeOperation = 'source-over';
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative h-[200px] w-full mt-4 bg-[#0a0a14]/50 rounded-lg border border-white/5 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};

// ─── VAULT ACTIVITY ───────────────────────────────────────────────────────────
// FIX: useMemo to prevent re-randomising on every render
const VaultActivityHeatmap: React.FC = () => {
  const bars = useMemo(() => Array.from({ length: 60 }, () => {
    const height = Math.random() * 100;
    const isCyan = Math.random() > 0.85;
    const isFuchsia = Math.random() > 0.4 && !isCyan;
    return { height, isCyan, isFuchsia };
  }), []);

  return (
    <div className="mt-4">
      <div className="flex items-end justify-between gap-px h-16 w-full">
        {bars.map((bar, i) => {
          let bgColor = 'bg-white/10', shadow = '';
          if (bar.isCyan) { bgColor = 'bg-cyan-400'; shadow = 'shadow-[0_0_10px_#22d3ee] z-10'; }
          else if (bar.isFuchsia) { bgColor = 'bg-fuchsia-500/80'; shadow = 'shadow-[0_0_5px_rgba(217,70,239,0.5)]'; }
          else if (bar.height > 50) { bgColor = 'bg-[#312e81]'; }
          return (
            <div key={i} className={`w-full rounded-t-[1px] ${bgColor} ${shadow}`}
              style={{ height: `${bar.height}%`, opacity: bar.height < 20 ? 0.3 : 1 }} />
          );
        })}
      </div>
      <div className="flex justify-between text-[8px] font-mono text-slate-600 uppercase mt-2">
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
};

// ─── NODE INTELLIGENCE POPUP ──────────────────────────────────────────────────
const NodeIntelligencePopup: React.FC = () => (
  <div className="absolute top-12 right-12 w-64 bg-[#0d0d1e]/95 border border-fuchsia-500/30 p-4 rounded-xl backdrop-blur-2xl z-20 shadow-[0_0_40px_rgba(217,70,239,0.15)] hidden md:block">
    <h4 className="text-[10px] uppercase font-black text-white border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
      <Radio size={12} className="text-fuchsia-400" />
      Node Intelligence
    </h4>
    <div className="space-y-2 text-[9px] font-mono tracking-wide">
      <div className="flex justify-between"><span className="text-slate-400">NODE:</span><span className="text-cyan-400 font-bold">OMEGA-PRIME-SX</span></div>
      <div className="flex justify-between"><span className="text-slate-400">MICRO-OPTION LEVEL:</span><span className="text-white">OMEGA</span></div>
      <div className="flex justify-between"><span className="text-slate-400">SYNAPSE MACRO 70:</span><span className="text-white">35%</span></div>
      <div className="flex justify-between"><span className="text-slate-400">DATA THROUGHPUT:</span><span className="text-cyan-400 font-bold">4.5 TSL/S</span></div>
      <div className="flex justify-between"><span className="text-slate-400">ENTITIES:</span><span className="text-white">6 GMUX</span></div>
    </div>
    <div className="mt-4 h-6 w-full border-t border-white/10 pt-2 flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 100 20" className="w-full h-full stroke-fuchsia-500 stroke-1 fill-none drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]">
        <path d="M0,10 Q10,0 20,10 T40,10 T60,10 T80,10 T100,10" />
      </svg>
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({ memories: 0, projects: 0, files: 0, links: 0 });
  const [topTags, setTopTags] = useState<{ label: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setIsMounted(true);
    async function fetchStats() {
      const [{ count: mCount }, { count: pCount }, { count: fCount }, { data: tagData }] = await Promise.all([
        supabase.from('memories').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('code_memories').select('*', { count: 'exact', head: true }),
        supabase.from('memories').select('tag').not('tag', 'is', null),
      ]);
      const m = mCount || 0, p = pCount || 0, f = fCount || 0;
      setStats({ memories: m, projects: p, files: f, links: m * 3 + f });
      if (tagData) {
        const freq: Record<string, number> = {};
        tagData.forEach((row: any) => { if (row.tag) freq[row.tag] = (freq[row.tag] || 0) + 1; });
        setTopTags(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count })));
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const val = (n: number) => loading ? '—' : n;

  const menuItems: MenuItem[] = [
    { icon: Map, label: 'Neural Map', active: true },
    { icon: Activity, label: 'Data Streams' },
    { icon: Database, label: 'Core Memories', value: loading ? '—' : `${stats.files}F` },
    { icon: ShieldCheck, label: 'System Health' },
    { icon: Lock, label: 'Security Logs' },
  ];

  if (!isMounted) return <div className="min-h-screen bg-[#070714]" />;

  return (
    <div className="min-h-screen bg-[#070714] text-slate-200 p-4 md:p-8 font-sans selection:bg-fuchsia-500/30 overflow-hidden relative">
      
      {/* Background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")` }} />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-900/20 blur-[150px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[150px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
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
        
        {/* Stat Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Brain} value={val(stats.memories)} label="Total Memories" percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Folder} value={val(stats.projects)} label="Active Projects" percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Hexagon} value={val(stats.files)} label="Neural Clusters" percentage="90%" glowColor="cyan" />
          <StatCard icon={Zap} value={val(stats.links)} label="Neural Links" percentage="90%" glowColor="cyan" />
          <StatCard icon={FileText} value={val(stats.files)} label="Owned Files" percentage="90%" glowColor="fuchsia" className="col-span-2 md:col-span-2" />
        </div>

        {/* Top Labels */}
        <Card className="lg:row-span-2 flex flex-col !p-5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Top Labels</span>
          {!loading && topTags.length > 0 ? (
            <div className="flex flex-col gap-3 flex-1 justify-center">
              {topTags.slice(0, 4).map(({ label, count }, i) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-300">{label}</span>
                    <span className="text-[8px] font-bold text-fuchsia-400">{count}</span>
                  </div>
                  <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round((count / (topTags[0]?.count || 1)) * 100)}%`,
                      background: i === 0 ? 'linear-gradient(to right,#c026d3,#d946ef)' : i === 1 ? 'linear-gradient(to right,#0e7490,#22d3ee)' : 'linear-gradient(to right,#4338ca,#818cf8)',
                      boxShadow: i === 0 ? '0 0 6px rgba(217,70,239,0.5)' : 'none'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center mt-4">
              <div className="mb-4">
                <Tag size={40} className="text-fuchsia-500/50 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]" strokeWidth={1} />
              </div>
              <p className="text-[11px] uppercase font-bold tracking-widest text-fuchsia-400 mb-2 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]">
                Awaiting<br/>Classification
              </p>
              <p className="text-[9px] text-slate-500 max-w-[120px] leading-relaxed">Initialize tagging protocol to start your memories.</p>
            </div>
          )}
        </Card>

        {/* Knowledge Density */}
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

        {/* Neural Scan */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="!p-0" glowColor="none">
            <div className="p-5 pb-2">
              <h3 className="text-[11px] uppercase font-bold tracking-widest text-white">Neural Scan</h3>
              <NeuralScan />
            </div>
            <div className="space-y-0 pb-4">
              {menuItems.map((item, i) => (
                <div key={i} className={`flex items-center justify-between py-3 px-6 cursor-pointer transition-all border-l-2 ${item.active ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/10 to-transparent' : 'border-transparent hover:bg-white/5'}`}>
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

        {/* Neural Web Cluster + Vault Activity */}
        <div className="lg:col-span-2 space-y-4">
          <Card glowColor="none">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hexagon size={14} className="text-fuchsia-500" />
                <h3 className="text-[11px] uppercase font-bold tracking-widest text-white">Neural Web Cluster</h3>
              </div>
            </div>
            <div className="text-[9px] font-bold text-slate-400 mb-1">Omega-Prime Cluster</div>
            <div className="text-[9px] text-slate-500">Links: <span className="text-white">Active [{val(stats.links)}]</span></div>
            <NeuralNetworkGraph />
            <div className="flex gap-4 mt-3 text-[9px]">
              <span className="text-slate-500">Node Density: <span className="text-white">High</span></span>
              <span className="text-slate-500">Synapse Flow: <span className="text-cyan-400">Optimal</span></span>
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
