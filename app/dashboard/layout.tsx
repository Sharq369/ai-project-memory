'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LayoutDashboard, Folder, Brain, Search, Settings, Menu, X } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [checked, setChecked] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check session once at layout level
  // All child pages inherit this — no need to check again
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setChecked(true)
    }
    checkSession()
  }, [])

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Memories', href: '/dashboard/memories', icon: Brain },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder },
    { name: 'AI Search', href: '/dashboard/ai-search', icon: Search },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  // Don't render children until session is confirmed
  if (!checked) {
    return (
      <div className="flex min-h-screen bg-[#0f1117] items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      {/* MOBILE BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f1117] border-b border-gray-800/50 flex items-center px-4 justify-between z-[60]">
        <div className="font-black italic text-xl tracking-tighter">MEMORY AI</div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white active:scale-90 transition-transform">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0f1117] border-r border-gray-800/50 flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        <div className="p-8 italic font-black text-xl tracking-tighter hidden lg:block">MEMORY AI</div>
        <nav className="flex-1 px-4 space-y-2 mt-20 lg:mt-0">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-all
                ${pathname === item.href ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}
              `}
            >
              <item.icon size={16} /> {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-0 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
