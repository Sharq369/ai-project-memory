'use client'

import { useState } from 'react'

export default function SyncProvider({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEstablishLink = async () => {
    if (!url) {
      alert("Please enter a repository URL")
      return
    }
    
    setLoading(true)
    try {
      // Matches your folder structure: app/api/sync/trigger/route.ts
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          projectId: projectId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sync Failed')
      }

      alert(`Success! Synced ${data.count} blocks to your Neural Memory.`)
      window.location.reload() 

    } catch (error: any) {
      alert(`Sync Failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-[#0a0a0c] border border-white/10 rounded-xl">
      <h3 className="text-white font-bold mb-2 text-sm tracking-widest">NEURAL SYNC</h3>
      <p className="text-gray-500 text-xs mb-4">Connect GitHub repository to index code blocks.</p>
      <input 
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/username/repo"
        className="w-full p-3 bg-black border border-white/10 rounded-lg mb-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
      />
      <button 
        onClick={handleEstablishLink}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'SYNCING NEURAL NODES...' : 'ESTABLISH LINK'}
      </button>
    </div>
  )
}
