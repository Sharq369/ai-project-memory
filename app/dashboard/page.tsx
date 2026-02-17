'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Database, Folder, Activity, Zap, TrendingUp } from 'lucide-react'

export default function OverviewPage() {
  const [stats, setStats] = useState({
    totalMemories: 0,
    totalProjects: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const [{ count: mCount }, { count: pCount }] = await Promise.all([
        supabase.from('memories').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true })
      ])

      setStats({
        totalMemories: mCount || 0,
        totalProjects: pCount || 0,
        recentActivity: 12, // Mocked for now, can be calculated from timestamps
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  const cards = [
    { name: 'Total Memories', value: stats.totalMemories, icon: Database, color: 'text-blue-400' },
    { name: 'Active Projects', value: stats.totalProjects, icon: Folder, color: 'text-emerald-400' },
    { name: 'Neural Links', value: stats.totalMemories * 3, icon: Zap, color: 'text-purple-400' },
    { name: '7-Day Activity', value: `+${stats.recentActivity}%`, icon: TrendingUp, color: 'text-orange-400' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-white">System Overview</h1>
        <p className="text-gray-500 text-sm">Real-time diagnostics of your neural vault.</p>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.name} className="bg-[#16181e] border border-gray-800 p-6 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-gray-900 ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{loading ? '...' : card.value}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{card.name}</div>
          </div>
        ))}
      </div>

      {/* Visualization Mockup (Placeholder for Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#16181e] border border-gray-800 rounded-2xl p-6 h-[300px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={16} className="text-blue-400" />
            <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Knowledge Density</span>
          </div>
          <div className="flex-1 flex items-end gap-2">
            {[40, 70, 45, 90, 65, 80, 30, 95, 50, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-600/20 rounded-t-sm border-t border-blue-500/40 transition-all hover:bg-blue-500/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#16181e] border border-gray-800 rounded-2xl p-6">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter block mb-6">Top Categories</span>
          <div className="space-y-4">
            {['SaaS', 'Coding', 'Design'].map((tag, i) => (
              <div key={tag} className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-gray-400">{tag}</span>
                  <span className="text-white">{100 - (i * 20)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${100 - (i * 20)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
