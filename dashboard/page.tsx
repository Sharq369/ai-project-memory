import React from 'react';
import { Plus, Sparkles, Clock, Star } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-zinc-400">Your project memory is synced and ready.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
          <Plus size={18} />
          New Memory
        </button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Memories', value: '124', icon: Sparkles, color: 'text-purple-500' },
          { label: 'Recently Linked', value: '12', icon: Clock, color: 'text-blue-500' },
          { label: 'Starred Items', value: '5', icon: Star, color: 'text-yellow-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <stat.icon className={`${stat.color} mb-4`} size={24} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-zinc-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Placeholder for Recent Memories */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="h-32 bg-white/5 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-zinc-500 italic">
            Your recent project notes will appear here...
          </div>
        </div>
      </div>
    </div>
  );
}
