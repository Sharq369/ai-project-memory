"use client"

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SyncProvider({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const supabase = createClientComponentClient()

  const handleSync = async () => {
    if (!repoUrl) return alert("Please enter a repository URL")
    
    setIsLoading(true)
    
    try {
      // 1. Get your active session token
      const { data: { session } } = await supabase.auth.getSession()
      
      // 2. Trigger the server-side API
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` // Identifies YOU to the server
        },
        body: JSON.stringify({
          url: repoUrl,
          projectId: projectId 
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Success! Synced ${data.count} blocks to your Neural Memory.`)
      } else {
        alert(`Sync Failed: ${data.error}`)
      }
    } catch (err) {
      alert("Sync Failed: Connection error.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-[#0a0a0a] border border-blue-900/30 rounded-xl">
      <input 
        type="text"
        placeholder="https://github.com/username/repo"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        className="w-full p-3 mb-4 bg-black border border-gray-800 rounded text-white"
      />
      
      <button 
        onClick={handleSync}
        disabled={isLoading}
        className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
          isLoading ? 'bg-blue-900 opacity-70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>INITIALIZING NEURAL LINK...</span>
          </>
        ) : (
          "ESTABLISH LINK"
        )}
      </button>
    </div>
  )
}
