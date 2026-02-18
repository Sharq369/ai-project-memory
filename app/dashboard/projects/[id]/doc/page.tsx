'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
// Using @/ ensures the computer finds the root folder perfectly
import { supabase } from '@/lib/supabase'
import TaskSentinel from '@/components/TaskSentinel'
import { Terminal, Database, Search, Code, Cpu } from 'lucide-react'

export default function ProjectMainView() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    async function fetchProject() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      if (data) setProject(data)
    }
    fetchProject()
  }, [projectId])

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#050505] overflow-hidden">
      
      {/* LEFT: THE SENTINEL (Context Guardian) */}
      <TaskSentinel projectId={projectId} />

      {/* RIGHT: THE WORKSPACE */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 border-b border-gray-900 bg-[#0a0b0f] flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Cpu className="text-blue-500" size={16} />
            <h1 className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">
              {project?.name || 'Loading Protocol...'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
              Link: {project?.id?.slice(0,8)}
            </span>
          </div>
        </header>

        {/* MAIN INTERFACE */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* SEARCH BLOCK */}
            <section className="bg-[#0f1117] border border-gray-800 p-10 lg:p-16 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Code size={120} />
              </div>

              <div className="relative z-10 text-center space-y-6">
                <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-4">
                  <Database size={32} />
                </div>
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Neural Memory Access</h2>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em] max-w-sm mx-auto">
                  Execute queries against the established project link. 
                  Follow the Sentinel for active task locks.
                </p>

                <div className="relative mt-10 group max-w-xl mx-auto">
                  <input 
                    className="w-full bg-black border border-gray-800 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-500 transition-all font-mono text-xs pr-16"
                    placeholder="Ask about the implementation..."
                  />
                  <button className="absolute right-3 top-3 bg-white text-black p-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                    <Terminal size={18} />
                  </button>
                </div>
              </div>
            </section>

            {/* STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f1117] border border-gray-800 p-8 rounded-3xl flex flex-col justify-between">
                <Search className="text-gray-600 mb-6" size={20} />
                <div>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Retrieval Engine</p>
                  <p className="text-xs text-white font-bold italic uppercase tracking-widest underline decoration-blue-500 decoration-2">Standby Mode</p>
                </div>
              </div>

              <div className="bg-[#0f1117] border border-gray-800 p-8 rounded-3xl flex flex-col justify-between">
                <div className="w-2 h-2 bg-blue-500 rounded-full mb-6 shadow-[0_0_10px_#3b82f6]" />
                <div>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Sync</p>
                  <p className="text-xs text-white font-bold italic uppercase tracking-widest">Protocol Active</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
