'use client';

import React from 'react';
import { Search, Filter, Calendar, Tag, MoreHorizontal } from 'lucide-react';

export default function MemoriesPage() {
  // Dummy data to see how it looks
  const memories = [
    { id: 1, title: "App Navigation Flow", tag: "UX Design", date: "Today, 10:23 AM", content: "We need to simplify the sidebar logic..." },
    { id: 2, title: "Supabase Schema", tag: "Database", date: "Yesterday", content: "Users table needs a foreign key for..." },
    { id: 3, title: "Vercel Deployment", tag: "DevOps", date: "Feb 12", content: "Fixed the build error by moving the folder..." },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">All Memories</h1>
          <p className="text-zinc-400">Search and filter your external brain.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search memories..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Memories Grid */}
      <div className="grid gap-4">
        {memories.map((memory) => (
          <div key={memory.id} className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/30 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md font-medium flex items-center gap-1">
                <Tag size={12} />
                {memory.tag}
              </span>
              <button className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal size={18} />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-1">{memory.title}</h3>
            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{memory.content}</p>
            
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Calendar size={12} />
              <span>{memory.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
