'use client'

import { useState } from 'react'
import { Github, Gitlab, HardDrive, Zap, X, Loader2 } from 'lucide-react'

// ... existing imports and fetch logic ...

export default function ProjectVault() {
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const triggerSync = async (projectId: string, repoUrl: string) => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, repoUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      alert("Neural Link Established: Memory Blocks Retrieved.")
      setSelectedNode(null) // Close frame
    } catch (err: any) {
      alert(`Sync Failed: ${err.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6 font-sans">
      {/* ... Your Project Grid ... */}

      {/* Futuristic Provider Selection Frame */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090d]/90 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#111319] border border-blue-500/20 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Animated Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full" />
            
            {/* Header */}
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Select Source</h2>
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Neural Link Authorization</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Provider Options */}
            <div className="space-y-3 relative z-10">
              
              {/* GitHub - THE ACTIVE ONE */}
              <button 
                onClick={() => triggerSync(selectedNode.id, selectedNode.repo_url)}
                disabled={isSyncing}
                className="group w-full flex items-center justify-between bg-[#1a1d26] border border-gray-800 p-5 rounded-2xl hover:border-blue-500 hover:bg-blue-500/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Github size={22} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">GitHub Protocol</span>
                </div>
                {isSyncing ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Zap size={16} className="text-gray-600 group-hover:text-blue-500" />}
              </button>

              {/* GitLab - Locked Design */}
              <button className="w-full flex items-center gap-4 bg-[#111319] border border-gray-900 p-5 rounded-2xl opacity-40 cursor-not-allowed">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <Gitlab size={22} className="text-gray-600" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">GitLab (Encrypted)</span>
              </button>

              {/* Bitbucket - Locked Design */}
              <button className="w-full flex items-center gap-4 bg-[#111319] border border-gray-900 p-5 rounded-2xl opacity-40 cursor-not-allowed">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <HardDrive size={22} className="text-gray-600" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">Bitbucket (Offline)</span>
              </button>
            </div>

            {/* Footer Text */}
            <p className="mt-8 text-center text-gray-600 text-[8px] font-bold uppercase tracking-[0.2em] relative z-10">
              Secure tunneling via Gemini Flash-1.5 Protocol
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
