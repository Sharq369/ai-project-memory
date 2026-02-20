"use client"

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Use your existing environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SyncProvider({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')

  const handleSync = async () => {
    if (!repoUrl) return alert("Please enter a repository URL")
    setIsLoading(true)
    
    try {
      // Get the session using the standard client
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ url: repoUrl, projectId: projectId }),
      })

      const data = await response.json()
      if (data.success) alert(`Success! Synced ${data.count} blocks.`)
      else alert(`Sync Failed: ${data.error}`)
    } catch (err) {
      alert("Sync Failed: Connection error.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 bg-black/50 border border-blue-900/20 rounded-lg">
      <input 
        type="text" 
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="GitHub Repo URL"
        className="w-full p-2 mb-2 bg-gray-900 border border-gray-800 rounded text-white text-sm"
      />
      <button 
        onClick={handleSync}
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 rounded font-bold text-xs"
      >
        {isLoading ? "INITIALIZING NEURAL LINK..." : "ESTABLISH LINK"}
      </button>
    </div>
  )
}
