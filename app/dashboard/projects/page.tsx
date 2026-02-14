'use client';

import React from 'react';
import { Folder, Plus, MoreVertical, GitBranch, Clock } from 'lucide-react';

export default function ProjectsPage() {
  const projects = [
    { id: 1, name: "Website Redesign", status: "Active", memories: 12, lastActive: "2h ago" },
    { id: 2, name: "Mobile App API", status: "In Progress", memories: 8, lastActive: "1d ago" },
    { id: 3, name: "Marketing Campaign", status: "Planning", memories: 3, lastActive: "3d ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-zinc-400">Organize your thoughts into actionable goals.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
          <Plus size={18} />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-blue-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <Folder size={24} />
              </div>
              <button className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={18} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {project.status}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-white/5">
              <div className="flex items-center gap-1">
                <GitBranch size={14} />
                {project.memories} Memories
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {project.lastActive}
              </div>
            </div>
          </div>
        ))}
        
        {/* "Create New" Placeholder Card */}
        <button className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-white/30 transition-all h-full min-h-[200px]">
          <Plus size={32} className="mb-2" />
          <span className="font-medium">Create New Project</span>
        </button>
      </div>
    </div>
  );
}
