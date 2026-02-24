'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// DEBUG: Catching setup errors
let supabase: any;
try {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} catch (e) {
  if (typeof window !== 'undefined') alert("Supabase Config Error: " + e)
}

export default function ProjectVault() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Checkpoint 1: Did the component actually load?
    alert("Checkpoint 1: Component Mounted");

    async function fetchProjects() {
      try {
        alert("Checkpoint 2: Fetching from Supabase...");
        const { data, error } = await supabase.from('projects').select('*');
        
        if (error) {
          alert("Supabase Error: " + error.message);
        } else {
          alert("Checkpoint 3: Data Received! Count: " + (data?.length || 0));
          setProjects(data || []);
        }
      } catch (err: any) {
        alert("Fetch Crash: " + err.message);
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleTestClick = (name: string) => {
    alert("SUCCESS! You clicked: " + name);
  }

  if (loading) return <div style={{padding: '50px', color: 'white'}}>SYSTEM LOADING...</div>

  return (
    <div style={{ backgroundColor: '#0b0c10', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <h1 style={{fontSize: '30px', fontWeight: 'bold'}}>DEBUG TERMINAL</h1>
      
      <div style={{ marginTop: '20px' }}>
        {projects.length === 0 && <p>No projects found in Database.</p>}
        
        {projects.map((project) => (
          <div 
            key={project.id} 
            style={{ 
              border: '2px solid #3b82f6', 
              padding: '20px', 
              marginBottom: '10px',
              borderRadius: '15px'
            }}
          >
            <h2 style={{fontSize: '20px'}}>{project.name}</h2>
            <button 
              onClick={() => handleTestClick(project.name)}
              style={{ 
                backgroundColor: '#1d4ed8', 
                color: 'white', 
                padding: '15px 30px', 
                marginTop: '10px',
                borderRadius: '10px',
                width: '100%',
                fontWeight: 'bold'
              }}
            >
              TAP TO TEST CLICK
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
