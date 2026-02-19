'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 
import { CheckCircle2, Circle, Lock, ChevronRight } from 'lucide-react'

export default function TaskSentinel({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    async function loadTasks() {
      const { data } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('order_index')
      if (data) setTasks(data)
    }
    loadTasks()
  }, [projectId])

  const toggleTask = async (id: string, current: boolean, index: number) => {
    if (index > 0 && !tasks[index-1].completed) return 
    const { error } = await supabase.from('tasks').update({ completed: !current }).eq('id', id)
    if (!error) setTasks(tasks.map(t => t.id === id ? { ...t, completed: !current } : t))
  }

  return (
    <div className="w-80 bg-[#0a0b0f] border-r border-white/5 flex flex-col hidden lg:flex">
      <div className="p-8 border-b border-white/5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Sentinel Protocol</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tasks.map((task, i) => {
          const isLocked = i > 0 && !tasks[i-1].completed
          return (
            <div 
              key={task.id}
              onClick={() => !isLocked && toggleTask(task.id, task.completed, i)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                task.completed ? 'bg-blue-500/5 border-blue-500/20' : 
                isLocked ? 'bg-black/40 border-transparent opacity-30' : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {task.completed ? <CheckCircle2 size={16} className="text-blue-500" /> : isLocked ? <Lock size={16} /> : <Circle size={16} />}
                <span className="text-[11px] font-bold uppercase tracking-tighter">{task.title}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
