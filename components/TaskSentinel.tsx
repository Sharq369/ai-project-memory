'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle2, Lock, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react'

export default function TaskSentinel({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks', 
        filter: `project_id=eq.${projectId}` 
      }, fetchTasks)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
    if (data) setTasks(data)
    setLoading(false)
  }

  const toggleTask = async (task: any, index: number) => {
    const isFirst = index === 0
    const prevTaskCompleted = isFirst || tasks[index - 1].status === 'completed'

    if (!prevTaskCompleted && task.status !== 'completed') {
      alert("LOCKED: Complete previous step first! 🛑")
      return
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
  }

  const addTask = async (e: any) => {
    e.preventDefault()
    const title = e.target.taskName.value
    if (!title) return
    await supabase.from('tasks').insert([{ 
      project_id: projectId, 
      title, 
      position: tasks.length + 1, 
      status: 'pending' 
    }])
    e.target.reset()
  }

  if (loading) return <div className="p-6"><Loader2 className="animate-spin text-blue-500" size={20} /></div>

  return (
    <div className="flex flex-col h-full bg-[#0a0b0f] border-r border-gray-800 w-full lg:w-80">
      <div className="p-6 border-b border-gray-800 bg-[#0f1117]">
        <h2 className="text-xs font-black text-white italic uppercase tracking-[0.2em] flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Workflow Sentinel
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.map((task, index) => {
          const isLocked = index !== 0 && tasks[index - 1].status !== 'completed'
          const isDone = task.status === 'completed'

          return (
            <div 
              key={task.id}
              onClick={() => toggleTask(task, index)}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                isDone 
                  ? 'bg-green-500/5 border-green-500/30' 
                  : isLocked 
                    ? 'bg-gray-900/40 border-gray-800 opacity-40 grayscale' 
                    : 'bg-red-500/5 border-red-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col pr-4">
                  <span className={`text-[10px] font-bold ${isDone ? 'text-green-500/50' : 'text-gray-500'} uppercase tracking-tighter`}>
                    Step 0{index + 1}
                  </span>
                  <span className={`text-xs font-black uppercase tracking-tight ${isDone ? 'text-green-500 line-through' : 'text-white'}`}>
                    {task.title}
                  </span>
                </div>
                <div>
                  {isDone ? <CheckCircle2 className="text-green-500" size={18} /> : isLocked ? <Lock className="text-gray-700" size={18} /> : <AlertCircle className="text-red-500 animate-pulse" size={18} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={addTask} className="p-4 bg-[#0f1117] border-t border-gray-800 flex gap-2">
        <input name="taskName" className="flex-1 bg-black border border-gray-800 rounded-xl px-4 py-3 text-[10px] text-white outline-none focus:border-blue-500" placeholder="Next Protocol..." />
        <button className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500"><Plus size={18} /></button>
      </form>
    </div>
  )
}
