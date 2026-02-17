'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, Folder, Settings, LayoutDashboard, BrainCircuit } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Memories', href: '/dashboard/memories', icon: PlusCircle },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder },
    { name: 'AI Search', href: '/dashboard/ai-search', icon: Search },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0f1117] text-gray-400">
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-800 p-6 bg-[#0f1117] sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-lg"><BrainCircuit className="text-white" size={20} /></div>
          <span className="text-white font-bold tracking-tight text-lg">Memory AI</span>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'hover:bg-gray-800/50'}`}>
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto"><div className="p-4 md:p-8 pb-32 md:pb-8">{children}</div></main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#16181e]/90 backdrop-blur-xl border-t border-gray-800 px-6 py-4 flex justify-around items-center z-50">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1">
            <item.icon size={22} className={pathname === item.href ? 'text-blue-400' : 'text-gray-500'} />
            <span className={`text-[10px] font-bold uppercase ${pathname === item.href ? 'text-blue-400' : 'text-gray-600'}`}>{item.name.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
