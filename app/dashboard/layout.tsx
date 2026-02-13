'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Search, 
  Settings, 
  LogOut,
  FolderOpen
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // THIS IS THE LOG OUT LOGIC
  const handleSignOut = async () => {
    await supabase.auth.signOut(); // Ends the Supabase session
    router.push('/login'); // Sends you back to the login page
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Memories', href: '/dashboard/memories', icon: BrainCircuit },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
    { name: 'AI Search', href: '/dashboard/search', icon: Search },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 px-2 mb-8 text-blue-500">
            <BrainCircuit size={24} />
            <span className="font-bold tracking-tight text-xl text-white">Memory AI</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SIGN OUT BUTTON AT THE BOTTOM */}
        <div className="mt-auto p-6 border-t border-white/10">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full text-zinc-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
