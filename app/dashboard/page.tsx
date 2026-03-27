"use client";

import React, { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { 
  Folder, Zap, Brain, Hexagon, Tag, 
  Map, Activity, Database, TrendingUp, BarChart2
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// ------------------------------------------------------------------
// 1. TYPES
// ------------------------------------------------------------------
interface Stats {
  memories: number;
  projects: number;
  clusters: number;
  links: number;
}

// ------------------------------------------------------------------
// 2. UI COMPONENTS — UNTOUCHED from original design
// ------------------------------------------------------------------

const Card = memo(({ children, className = '', glowColor = 'none' }: { children: React.ReactNode; className?: string; glowColor?: 'fuchsia' | 'cyan' | 'none' }) => {
  const edgeGlows = {
    fuchsia: 'bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-[0_2px_20px_-2px_rgba(217,70,239,0.7)]',
    cyan: 'bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_2px_20px_-2px_rgba(34,211,238,0.7)]',
    none: 'bg-transparent'
  };
  return (
    <div className={`relative overflow-hidden rounded-xl border border-[#1a1a3a] bg-[#0b0b16]/80 backdrop-blur-xl p-5 shadow-2xl ${className}`}>
      {glowColor !== 'none' && (
        <>
          <div className={`absolute top-0 left-0 right-0 h-[1px] ${edgeGlows[glowColor]} opacity-100`} />
          <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none" />
        </>
      )}
      {children}
    </div>
  );
});
Card.displayName = "Card";

const StatCard = ({ icon: Icon, value, label, percentage, glowColor }: any) => (
  <Card glowColor={glowColor}>
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg bg-${glowColor}-500/10 border border-${glowColor}-500/20`}>
        <Icon size={18} className={glowColor === 'fuchsia' ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'} />
      </div>
      {percentage && <span className="text-[10px] text-slate-400 font-mono transition-all">{percentage}</span>}
    </div>
    <h3 className="text-3xl font-black text-white tracking-tighter drop-shadow-md transition-all duration-300">{value}</h3>
    <p className="text-[9px] uppercase text-slate-400 tracking-widest mt-1">{label}</p>
  </Card>
);

// ------------------------------------------------------------------
// 3. HEAVY VISUALS — UNTOUCHED from original design
// ------------------------------------------------------------------

const NeuralScan = memo(() => (
  <div className="relative flex flex-col items-center justify-center py-8">
    <div className="relative w-[140px] h-[140px] flex items-center justify-center">
      <div className="absolute w-[90px] h-[90px] bg-fuchsia-600/30 blur-[25px] rounded-full mix-blend-screen" />
      <div className="relative animate-pulse flex items-center justify-center">
        <Brain size={68} className="absolute text-[#2a0a4a] blur-[2px] translate-y-[4px]" strokeWidth={2} />
        <Brain size={68} className="absolute text-fuchsia-600 blur-[8px] mix-blend-plus-lighter opacity-90" strokeWidth={1.5} />
        <Brain size={68} className="absolute text-fuchsia-400 blur-[2px] mix-blend-plus-lighter" strokeWidth={1.5} />
        <Brain size={68} className="relative text-[#ffccff] drop-shadow-[0_0_4px_#ffffff]" strokeWidth={1.5} />
      </div>
      <div className="absolute inset-[10px] border-t-2 border-l border-fuchsia-400/60 rounded-full animate-[spin_3s_cubic-bezier(0.4,0,0.2,1)_infinite] shadow-[0_0_15px_rgba(217,70,239,0.4)]" />
      <div className="absolute inset-[-2px] border-b border-r border-cyan-400/40 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
    </div>
    <div className="w-full mt-8 space-y-2">
      <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
        <span className="text-slate-400">Scanning...</span>
        <span className="text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]">84%</span>
      </div>
      <div className="w-full h-[4px] bg-[#05050a] rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] border border-white/5">
        <div className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-[#ffffff] relative shadow-[0_0_10px_rgba(217,70,239,1)]" style={{ width: `84%` }}>
          <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent mix-blend-overlay" />
        </div>
      </div>
    </div>
  </div>
));
NeuralScan.displayName = "NeuralScan";

const KnowledgeDensityChart = memo(({ data }: { data: number[] }) => {
  // Convert monthly counts to SVG points — scale to fit 300px height
  const maxVal = Math.max(...data, 1); // avoid div-by-zero
  const svgPoints = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 1000;
    // Higher count = lower Y (SVG Y is inverted), min y=30 max y=270
    const y = 270 - ((val / maxVal) * 240);
    return `${x},${y}`;
  }).join(' ');

  const nodes = svgPoints.split(' ').map(p => p.split(',').map(Number));

  return (
    <div className="relative w-full h-[220px] mt-6 bg-[#030308] rounded-lg border border-white/5 overflow-hidden flex items-end">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      {/* Empty state overlay when no data */}
      {maxVal === 1 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">No memory activity yet</span>
        </div>
      )}
      <svg viewBox="0 0 1000 300" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
            <stop offset="100%" stopColor="rgba(217,70,239,0)" />
          </linearGradient>
        </defs>
        <polygon points={`0,300 ${svgPoints} 1000,300`} fill="url(#fade)" />
        <polyline points={svgPoints} fill="none" stroke="rgba(217,70,239,0.4)" strokeWidth="25" className="blur-[12px] mix-blend-screen" />
        <polyline points={svgPoints} fill="none" stroke="rgba(34,211,238,0.8)" strokeWidth="8" className="blur-[4px] mix-blend-screen" />
        <polyline points={svgPoints} fill="none" stroke="#ffffff" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        {nodes.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="12" fill="rgba(34,211,238,0.2)" className="blur-[4px]" />
            <circle cx={x} cy={y} r="4" fill="#ffffff" className="drop-shadow-[0_0_6px_#22d3ee]" />
          </g>
        ))}
      </svg>
    </div>
  );
});
KnowledgeDensityChart.displayName = "KnowledgeDensityChart";

const VaultHeatmap = memo(() => {
  // FIX: useMemo so bars never re-randomise on re-render
  const bars = useMemo(() => 
    Array.from({ length: 42 }).map(() => Math.floor(Math.random() * 80) + 20),
  []);

  return (
    <Card glowColor="fuchsia" className="h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] flex items-center gap-2 uppercase font-black text-white tracking-widest">
          <BarChart2 size={14} className="text-fuchsia-400" /> Vault Activity
        </h3>
        <span className="text-[9px] text-fuchsia-400 font-mono flex items-center gap-1 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_8px_#d946ef]" /> Live
        </span>
      </div>
      <div className="flex items-end gap-[2px] h-[120px] w-full">
        {bars.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-fuchsia-900/40 to-fuchsia-400 rounded-t-sm relative group transition-all duration-300 hover:from-cyan-900/40 hover:to-cyan-400"
            style={{ height: `${height}%` }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_8px_#d946ef] group-hover:shadow-[0_0_8px_#22d3ee]" />
          </div>
        ))}
      </div>
    </Card>
  );
});
VaultHeatmap.displayName = "VaultHeatmap";

// ------------------------------------------------------------------
// 4. MAIN DASHBOARD — Live data wired in, design untouched
// ------------------------------------------------------------------

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  // FIX: Initial state is 0/loading instead of hardcoded fake numbers
  const [stats, setStats] = useState<Stats>({
    memories: 0,
    projects: 0,
    clusters: 0,
    links: 0,
  });
  const [loading, setLoading] = useState(true);
  const [topTags, setTopTags] = useState<{ label: string; count: number }[]>([]);
  // Monthly memory counts for Knowledge Density chart (last 12 months)
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));

  // FIX: createBrowserClient (SSR-safe) instead of bare createClient
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // FIX: Fetch real counts from actual tables on mount
  const fetchStats = useCallback(async () => {
    const [
      { count: mCount },
      { count: pCount },
      { count: fCount },
      { data: tagData },
      { data: memoryDates },
    ] = await Promise.all([
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('code_memories').select('*', { count: 'exact', head: true }),
      // FIX: fetch all tags so Top Labels card shows real data
      supabase.from('memories').select('tag').not('tag', 'is', null),
      // FIX: fetch created_at to build monthly Knowledge Density chart
      supabase.from('memories').select('created_at'),
    ]);

    const m = mCount || 0;
    const p = pCount || 0;
    const f = fCount || 0;

    setStats({
      memories: m,
      projects: p,
      clusters: f,
      links: m * 3 + f,
    });

    // Build top tags from real data
    if (tagData) {
      const freq: Record<string, number> = {};
      tagData.forEach((row: any) => {
        if (row.tag) freq[row.tag] = (freq[row.tag] || 0) + 1;
      });
      const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, count]) => ({ label, count }));
      setTopTags(sorted);
    }

    // Build monthly buckets for Knowledge Density (last 12 months)
    if (memoryDates) {
      const now = new Date();
      const buckets = Array(12).fill(0);
      memoryDates.forEach((row: any) => {
        if (!row.created_at) return;
        const d = new Date(row.created_at);
        const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (monthsAgo >= 0 && monthsAgo < 12) {
          buckets[11 - monthsAgo] += 1;
        }
      });
      setMonthlyData(buckets);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchStats();

    // FIX: Subscribe to INSERT + UPDATE + DELETE across all 3 real tables
    // (original code only listened to UPDATE on a non-existent system_stats table)

    const memoriesChannel = supabase
      .channel('memories_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'memories' },
        () => fetchStats() // Re-fetch on any change
      )
      .subscribe();

    const projectsChannel = supabase
      .channel('projects_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => fetchStats()
      )
      .subscribe();

    const filesChannel = supabase
      .channel('files_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'code_memories' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(memoriesChannel);
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(filesChannel);
    };
  }, [fetchStats]);

  if (!mounted) return <div className="min-h-screen bg-[#030308]" />;

  const display = (n: number) => loading ? '—' : n;

  return (
    <div className="min-h-screen bg-[#030308] text-slate-200 p-4 md:p-8 font-sans selection:bg-fuchsia-500/30">
      
      {/* Ambient background — untouched */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(217,70,239,0.03),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.03),transparent_40%)] pointer-events-none" />

      {/* Header — untouched */}
      <header className="mb-8 max-w-7xl mx-auto flex items-center gap-4">
        <div className="h-10 w-1 bg-gradient-to-b from-cyan-400 to-fuchsia-600 shadow-[0_0_15px_#d946ef]" />
        <div>
          <p className="text-[9px] text-fuchsia-500 font-bold uppercase tracking-[0.2em] mb-1">Neural Command</p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-md">System Overview</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-7xl mx-auto relative z-10">
        
        {/* Stat Cards — now show live Supabase counts */}
        <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Brain}   value={display(stats.memories)} label="Total Memories"  percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Folder}  value={display(stats.projects)} label="Active Projects"  percentage="90%" glowColor="fuchsia" />
          <StatCard icon={Hexagon} value={display(stats.clusters)} label="Neural Clusters"  percentage="90%" glowColor="cyan" />
          <StatCard icon={Zap}     value={display(stats.links)}    label="Neural Links"     percentage="90%" glowColor="cyan" />
        </div>

        {/* Top Labels — now shows real tags */}
        <div className="xl:col-span-1">
          <Card className="h-full flex flex-col p-5 border-fuchsia-500/20">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Top Labels</p>
            {!loading && topTags.length > 0 ? (
              <div className="flex flex-col gap-3 flex-1 justify-center">
                {topTags.map(({ label, count }, i) => {
                  const pct = Math.round((count / (topTags[0]?.count || 1)) * 100);
                  const colors = [
                    { bar: 'linear-gradient(to right,#c026d3,#d946ef)', glow: '0 0 6px rgba(217,70,239,0.5)' },
                    { bar: 'linear-gradient(to right,#0e7490,#22d3ee)', glow: 'none' },
                    { bar: 'linear-gradient(to right,#4338ca,#818cf8)', glow: 'none' },
                    { bar: 'linear-gradient(to right,#be185d,#f472b6)', glow: 'none' },
                    { bar: 'linear-gradient(to right,#0f766e,#2dd4bf)', glow: 'none' },
                  ];
                  const c = colors[i % colors.length];
                  return (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-300 truncate max-w-[80%]">{label}</span>
                        <span className="text-[8px] font-black text-fuchsia-400">{count}</span>
                      </div>
                      <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%`, background: c.bar, boxShadow: c.glow }} className="h-full rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <Tag size={32} className="text-fuchsia-500 mb-3 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
                <h3 className="text-fuchsia-400 font-black uppercase text-[11px] tracking-widest">Awaiting Classification</h3>
                <p className="text-[9px] text-slate-500 mt-2 tracking-wide">Initialize tagging protocol.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Knowledge Density + Vault Activity — untouched */}
        <div className="xl:col-span-3 space-y-6">
          <Card glowColor="fuchsia">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] flex items-center gap-2 uppercase font-black text-white tracking-widest">
                <Zap size={14} className="text-fuchsia-400" /> Knowledge Density
              </h3>
              <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                <TrendingUp size={12} /> +12% Growth
              </span>
            </div>
            <KnowledgeDensityChart data={monthlyData} />
          </Card>
          <div className="h-[200px]">
            <VaultHeatmap />
          </div>
        </div>

        {/* Neural Scan + Nav — Core Memories badge now shows live count */}
        <div className="xl:col-span-1 row-start-2 xl:row-start-auto space-y-6">
          <Card glowColor="none" className="!p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-[#101024]/50 to-transparent">
              <h3 className="text-[11px] uppercase font-black text-white tracking-widest">Neural Scan</h3>
              <NeuralScan />
            </div>
            <nav className="flex flex-col">
              {[
                { icon: Map,      label: 'Neural Map',      active: true,  val: null },
                { icon: Activity, label: 'Data Streams',    active: false, val: null },
                { icon: Database, label: 'Core Memories',   active: false, val: loading ? '—' : `${stats.clusters}F` },
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
