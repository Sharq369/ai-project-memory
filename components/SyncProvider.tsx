'use client'

import { useState } from 'react'

export function SyncProvider({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEstablishLink = async () => {
    setLoading(true)
    try {
      // THE TRIGGER: This matches your specific folder path exactly
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
      window.location.reload() // Refresh to show the new blocks on the card

    } catch (error: any) {
      alert(`Sync Failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-[#0a0a0c] border border-white/10 rounded-xl">
      <h3 className="text-white font-bold mb-4">NEURAL SYNC</h3>
      <input 
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/username/repo"
        className="w-full p-2 bg-black border border-white/20 rounded mb-4 text-white"
      />
      <button 
        onClick={handleEstablishLink}
        disabled={loading}
        className="w-full bg-blue-600 py-2 rounded font-bold text-white disabled:opacity-50"
      >
        {loading ? 'SYNCING...' : 'ESTABLISH LINK'}
      </button>
    </div>
  )
}
