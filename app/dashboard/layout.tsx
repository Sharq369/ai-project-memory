'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Folder, Brain, Search, Settings } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Memories', href: '/dashboard/memories', icon: Brain },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder },
    { name: 'AI Search', href: '/dashboard/ai-search', icon: Search },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      {/* FIXED SIDEBAR: Added 'hidden' for mobile, 'lg:flex' for desktop */}
      <aside className="hidden lg:flex w-64 border-r border-gray-800/50 flex-col fixed inset-y-0 bg-[#0f1117] z-50">
        <div className="p-8 italic font-black text-xl tracking-tighter flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg not-italic flex items-center justify-center">M</div>
          MEMORY AI
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-colors ${
                pathname === item.href ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              <item.icon size={16} /> {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-[#16181e] border border-gray-800 rounded-[2rem] p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest mb-4">Free Tier Active</p>
            <Link href="/dashboard/settings" className="block w-full py-3 bg-white text-black text-[9px] font-black uppercase rounded-xl">
              Upgrade Now
            </Link>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT: Added 'lg:ml-64' to make room for desktop sidebar, and 'relative z-10' */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-12 bg-[#0a0c10] relative z-10 pointer-events-auto">
        {children}
      </main>
    </div>
  )
}
