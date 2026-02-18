'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle2, Lock, AlertCircle, Plus } from 'lucide-react'

export default function TaskSentinel({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
    const channel = supabase
      .channel('sentinel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('position', { ascending: true })
    if (data) setTasks(data)
    setLoading(false)
  }

  const toggleTask = async (task: any, index: number) => {
    // Sequential Guard: Check if the previous task is done
    const isFirst = index === 0
    const prevDone = isFirst || tasks[index - 1].status === 'completed'

    if (!prevDone && task.status !== 'completed') {
      alert("⚠️ FLOW BLOCKED: Finish previous step first.")
      return
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
  }

  const addTask = async (e: any) => {
    e.preventDefault()
    const title = e.target.taskName.value
    if (!title) return
    await supabase.from('tasks').insert([{ project_id: projectId, title, position: tasks.length + 1, status: 'pending' }])
    e.target.reset()
  }

  if (loading) return <div className="p-4 text-[10px] font-black text-blue-500 uppercase tracking-widest">Sentinel Loading...</div>

  return (
    <div className="flex flex-col h-full bg-[#0a0b0f] border-r border-gray-800 w-full lg:w-80 font-sans">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
          Vibe Protocol
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tasks.map((task, index) => {
          const isLocked = index !== 0 && tasks[index - 1].status !== 'completed'
          const isDone = task.status === 'completed'

          return (
            <div 
              key={task.id}
              onClick={() => toggleTask(task, index)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isDone ? 'bg-green-500/5 border-green-500/20' : 
                isLocked ? 'bg-gray-900/40 border-gray-800 opacity-30 grayscale' : 
                'bg-red-500/5 border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold ${isDone ? 'text-green-500/40' : 'text-gray-600'}`}>0{index + 1}</span>
                  <span className={`text-xs font-bold tracking-tight ${isDone ? 'text-green-500 line-through' : 'text-white'}`}>
                    {task.title}
                  </span>
                </div>
                {isDone ? <CheckCircle2 className="text-green-500" size={16} /> : 
                 isLocked ? <Lock className="text-gray-700" size={16} /> : 
                 <AlertCircle className="text-red-600 animate-pulse" size={16} />}
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={addTask} className="p-4 bg-[#0a0b0f] border-t border-gray-800 flex gap-2">
        <input name="taskName" className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-blue-500" placeholder="Define Next Step..." />
        <button className="bg-white text-black p-2 rounded-lg hover:bg-gray-200"><Plus size={16} /></button>
      </form>
    </div>
  )
}
