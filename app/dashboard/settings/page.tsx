'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Folder, 
  Search, 
  Settings, 
  CreditCard,
  Crown 
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder },
    { name: 'AI Search', href: '/dashboard/search', icon: Search },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings }, // The missing button
  ]

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 flex flex-col fixed inset-y-0">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white font-black tracking-tighter text-xl">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">M</div>
            MEMORY AI
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                    : 'text-gray-500 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* PROMO: Upgrade Card at Bottom */}
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-b from-blue-600/10 to-transparent border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="text-blue-500" size={16} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Free Plan</span>
            </div>
            <p className="text-[9px] text-gray-500 leading-relaxed mb-4">
              Expand your neural capacity with unlimited projects.
            </p>
            <Link 
              href="/dashboard/projects" // Links to the section with plans
              className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold text-center uppercase tracking-[0.2em] rounded-xl transition-all"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 bg-[#0a0c10]">
        {children}
      </main>
    </div>
  )
}
