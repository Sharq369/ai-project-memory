'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Folder, Brain, Search, Settings, Menu, X } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      {/* MOBILE HEADER: So you can actually open the sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f1117] border-b border-gray-800 z-[60] flex items-center px-6">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* SIDEBAR: Controls visibility based on state */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 w-64 border-r border-gray-800/50 flex flex-col fixed inset-y-0 bg-[#0f1117] z-50 shadow-2xl lg:shadow-none`}>
        <div className="p-8 italic font-black text-xl tracking-tighter">MEMORY AI</div>
        <nav className="flex-1 px-4 space-y-2">
          {/* ... Your Nav Items ... */}
        </nav>
      </aside>

      {/* MAIN CONTENT: Remove 'relative z-10' and 'pointer-events-auto' to allow modal clicks */}
      <main className="flex-1 lg:ml-64 bg-[#0a0c10] min-h-screen pt-20 lg:pt-0">
        <div className="p-6 md:p-12">
          {children}
        </div>
      </main>
    </div>
  )
}
