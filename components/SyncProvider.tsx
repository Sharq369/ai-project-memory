'use client'
import { useState } from 'react'
import { RefreshCw, Zap, CheckCircle, AlertTriangle } from 'lucide-react'

export default function SyncProvider({ projectId, provider }: { projectId: string, provider: string }) {
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const triggerSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, provider })
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      setSyncing(false)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <button 
      onClick={triggerSync}
      disabled={syncing}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${
        status === 'success' ? 'bg-green-500/10 border-green-500 text-green-500' :
        status === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' :
        'bg-white/5 border-white/10 text-white hover:bg-white/10'
      }`}
    >
      {syncing ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
      {syncing ? 'Ingesting Code...' : status === 'success' ? 'Synced' : status === 'error' ? 'Retry' : `Sync ${provider}`}
    </button>
  )
}
