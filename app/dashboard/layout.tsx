'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Folder, 
  Search, 
  Settings, 
  Crown,
  Zap
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder },
    { name: 'AI Search', href: '/dashboard/ai-search', icon: Search },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings }, // The restored button
  ]

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-gray-800/50 flex flex-col fixed inset-y-0 bg-[#0f1117] z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 font-black tracking-tighter text-xl italic">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center not-italic">M</div>
            MEMORY AI
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-gray-500 hover:text-white hover:bg-gray-800/30'
                }`}
              >
                <item.icon size={16} strokeWidth={2.5} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Neural Capacity / Upgrade Card */}
        <div className="p-4 mt-auto">
          <div className="bg-[#16181e] border border-gray-800 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <Crown size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Free Tier</p>
                <p className="text-[9px] text-gray-500 font-medium">3 / 3 Nodes Active</p>
              </div>
            </div>
            <Link 
              href="/dashboard/settings" 
              className="block w-full py-3 bg-white text-black hover:bg-blue-500 hover:text-white text-[9px] font-black text-center uppercase tracking-[0.2em] rounded-xl transition-all"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </aside>

      {/* Content Wrapper */}
      <main className="flex-1 ml-64 min-h-screen bg-[#0a0c10]">
        <div className="p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  )
}
