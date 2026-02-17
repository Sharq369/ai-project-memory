// Use these Tailwind patterns in your layout
<div className="flex flex-col md:flex-row min-h-screen bg-[#0f1117]">
  {/* Sidebar - Hidden on mobile */}
  <aside className="hidden md:flex w-64 flex-col border-r border-gray-800 p-6">
    {/* Your Nav Links */}
  </aside>

  {/* Main Content */}
  <main className="flex-1 pb-24 md:pb-0 overflow-y-auto">
    {children}
  </main>

  {/* Mobile Bottom Nav - Only shows on small screens */}
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#16181e]/80 backdrop-blur-lg border-t border-gray-800 p-4 flex justify-around items-center z-50">
    <Home size={20} className="text-gray-400" />
    <Search size={20} className="text-blue-400" />
    <PlusCircle size={24} className="text-white" />
    <Folder size={20} className="text-gray-400" />
    <Settings size={20} className="text-gray-400" />
  </nav>
</div>
