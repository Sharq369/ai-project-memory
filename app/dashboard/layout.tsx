'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Database, Folder, Sparkles, Settings } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Memories', href: '/dashboard/memories', icon: Database },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder },
    { name: 'AI Search', href: '/dashboard/ai-search', icon: Sparkles },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden">
      
      {/* 1. MOBILE BACKDROP (Only blocks clicks when menu is OPEN) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. SIDEBAR (Fixed on mobile, Static on Desktop) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#16181e] border-r border-gray-800 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full" /> Memory AI
            </h2>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)} // Close menu on click
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* 3. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Mobile Header with Menu Button */}
        <header className="h-16 border-b border-gray-800 flex items-center px-4 md:hidden flex-shrink-0 bg-[#16181e] z-30 relative">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <span className="ml-3 font-semibold text-gray-200">Dashboard</span>
        </header>

        {/* PAGE CONTENT - z-0 ensures it is clickable and under the sidebar */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 z-0 relative">
          {children}
        </main>
      </div>
    </div>
  )
}
