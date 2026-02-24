'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function ProjectVault() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [debugError, setDebugError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!url || !key) {
          throw new Error("Missing Supabase Environment Variables in Vercel settings.")
        }

        const supabase = createClient(url, key)
        const { data, error } = await supabase.from('projects').select('*')
        
        if (error) throw error
        setProjects(data || [])
      } catch (err: any) {
        setDebugError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (debugError) {
    return (
      <div className="min-h-screen bg-red-900 p-10 text-white">
        <h1 className="text-2xl font-bold">🚨 CRASH DETECTED</h1>
        <p className="mt-4 font-mono bg-black p-4 rounded">{debugError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 bg-white text-black p-4 font-bold rounded"
        >
          REFRESH PAGE
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-6">
      <h1 className="text-4xl font-black italic uppercase mb-8">System Check</h1>
      
      {loading ? (
        <p className="animate-pulse">SYNCHRONIZING...</p>
      ) : (
        <div className="space-y-4">
          {projects.map(p => (
            <div key={p.id} className="border border-gray-800 p-6 rounded-3xl bg-[#111319]">
              <h2 className="text-xl font-bold mb-4">{p.name}</h2>
              <button 
                onClick={() => alert('Logic Terminal Active for ' + p.name)}
                className="w-full bg-blue-600 p-4 rounded-xl font-black uppercase text-xs active:scale-95 transition-transform"
              >
                Test Neural Link
              </button>
            </div>
          ))}
          {projects.length === 0 && <p className="text-gray-500">No nodes detected in database.</p>}
        </div>
      )}
    </div>
  )
}
