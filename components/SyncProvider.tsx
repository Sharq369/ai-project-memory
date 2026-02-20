"use client"

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Standard client setup to match your working MemoriesList.tsx
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SyncProviderProps {
  projectId: string
  provider?: string
}

export default function SyncProvider({ projectId, provider = 'github' }: SyncProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')

  const handleSync = async () => {
    if (!repoUrl) return alert("Please enter a repository URL")
    
    setIsLoading(true)
    
    try {
      // Get the session to pass the JWT to your API route
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session) {
        throw new Error("You must be logged in to sync code.")
      }

      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          url: repoUrl,
          projectId: projectId,
          provider: provider
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Neural Link Established: ${data.count} blocks synced.`)
        setRepoUrl('') // Clear input on success
      } else {
        alert(`Sync Failed: ${data.error}`)
      }
    } catch (err: any) {
      alert(`Connection Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-[#0a0a0a] border border-blue-900/30 rounded-xl shadow-2xl shadow-blue-500/10">
      <div className="flex flex-col gap-4">
        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
          Target {provider} Repository
        </label>
        
        <input 
          type="text"
          placeholder="https://github.com/username/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="w-full p-3 bg-black border border-gray-800 rounded-lg text-white text-sm focus:border-blue-500 outline-none transition-all font-mono"
        />
        
        <button 
          onClick={handleSync}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-black text-xs tracking-tighter transition-all flex items-center justify-center gap-2 ${
            isLoading 
              ? 'bg-blue-900/40 text-blue-300 cursor-not-allowed border border-blue-800/50' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></div>
              <span>INITIALIZING NEURAL LINK...</span>
            </>
          ) : (
            "ESTABLISH LINK"
          )}
        </button>
      </div>
    </div>
  )
}
