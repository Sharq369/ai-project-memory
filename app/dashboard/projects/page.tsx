'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DebugPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [msg, setMsg] = useState("System Ready")

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('projects').select('*')
      setProjects(data || [])
    }
    load()
  }, [])

  return (
    <div style={{ background: 'white', color: 'black', minHeight: '100vh', padding: '20px' }}>
      <h1>{msg}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {projects.map(p => (
          <div key={p.id} style={{ border: '2px solid black', padding: '20px' }}>
            <h2>{p.name}</h2>
            <button 
              onClick={() => {
                console.log("CLICKED");
                setMsg("CLICKED: " + p.name);
                alert("Working!");
              }}
              style={{ padding: '20px', background: 'blue', color: 'white', fontSize: '20px' }}
            >
              TEST CLICK ME
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
