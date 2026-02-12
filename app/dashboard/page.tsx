import { 
  LayoutDashboard, 
  FolderLock, 
  Search, 
  Plus, 
  BrainCircuit, 
  Clock, 
  Settings,
  MoreVertical,
  FileText
} from 'lucide-react';

// Mock data to visualize the VIP look
const MOCK_MEMORIES = [
  { id: 1, title: "Project Alpha Context", type: "JSON", date: "2 mins ago", size: "12kb" },
  { id: 2, title: "Q3 Strategy Notes", type: "Text", date: "1 hour ago", size: "4kb" },
  { id: 3, title: "Customer Personas", type: "PDF", date: "Yesterday", size: "1.2mb" },
];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-white/10">
      
      {/* 1. VIP Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl hidden md:flex flex-col">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <BrainCircuit className="text-black w-5 h-5" />
          </div>
          <span className="font-bold tracking-tighter uppercase">Vault</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={18} />} label="All Memories" active />
          <NavItem icon={<FolderLock size={18} />} label="Secure Projects" />
          <NavItem icon={<Clock size={18} />} label="Recent Activity" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <NavItem icon={<Settings size={18} />} label="Vault Settings" />
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col">
        
        {/* Header / Search */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/10 backdrop-blur-md">
          <div className="relative w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search your AI vault..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          
          <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
            <Plus size={16} />
            New Memory
          </button>
        </header>

        {/* Dashboard Content */}
        <section className="p-8 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Your AI Memories</h2>
            <p className="text-gray-500 text-sm">Everything stored in your encrypted context manager.</p>
          </div>

          {/* Grid of Memories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_MEMORIES.map((memory) => (
              <div 
                key={memory.id} 
                className="group relative p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-black transition-colors">
                    <FileText size={20} />
                  </div>
                  <button className="text-gray-500 hover:text-white">
                    <MoreVertical size={16} />
                  </button>
                </div>
                
                <h3 className="font-semibold text-lg mb-1">{memory.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 uppercase font-mono tracking-widest">{memory.type}</span>
                  <span>{memory.size}</span>
                  <span>•</span>
                  <span>{memory.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// Reusable Navigation Item Component
function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer
      ${active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}
    `}>
      {icon}
      {label}
    </div>
  );
}
