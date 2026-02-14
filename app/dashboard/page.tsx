'use client';

import React, { useState } from 'react';
import { Plus, Sparkles, Clock, Star, X } from 'lucide-react';

export default function DashboardPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Welcome back</h1>
          <p className="text-zinc-400">Your project memory is synced and ready.</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          New Memory
        </button>
      </header>

      {/* MODAL POPUP */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Capture Memory</h2>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <textarea 
              placeholder="What's on your mind? AI will tag this automatically..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 mb-4"
            />
            <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-white hover:bg-blue-500">
              Save to Vault
            </button>
          </div>
        </div>
      )}

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Memories', value: '124', icon: Sparkles, color: 'text-purple-500' },
          { label: 'Recently Linked', value: '12', icon: Clock, color: 'text-blue-500' },
          { label: 'Starred Items', value: '5', icon: Star, color: 'text-yellow-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <stat.icon className={`${stat.color} mb-4`} size={24} />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-zinc-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
