"use client"

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Update the interface here to include provider
interface SyncProviderProps {
  projectId: string;
  provider?: string; // Add this line to fix the TypeScript error
}

export default function SyncProvider({ projectId, provider = 'github' }: SyncProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')

  const handleSync = async () => {
    if (!repoUrl) return alert("Please enter a repository URL")
    setIsLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          url: repoUrl, 
          projectId: projectId,
          provider: provider // Pass the provider to your API
        }),
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
        placeholder={`${provider.toUpperCase()} Repo URL`}
        className="w-full p-2 mb-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:border-blue-500 outline-none"
      />
      <button 
        onClick={handleSync}
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 rounded font-bold text-xs transition-colors"
      >
        {isLoading ? "INITIALIZING NEURAL LINK..." : "ESTABLISH LINK"}
      </button>
    </div>
  )
}
