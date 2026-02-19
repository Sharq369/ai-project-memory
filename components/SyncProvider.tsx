'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, Zap, CheckCircle, AlertTriangle } from 'lucide-react'

export default function SyncProvider({ projectId, provider }: { projectId: string, provider: string }) {
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const triggerSync = async () => {
    setSyncing(true)
    setStatus('idle')
    
    try {
      // This calls our internal API which handles the specific provider logic (GitHub/Bitbucket)
      const res = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, provider })
      })

      if (!res.ok) throw new Error('Sync Failed')
      
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-4 bg-[#0a0b0f] border border-gray-800 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${syncing ? 'bg-blue-500/20 animate-pulse' : 'bg-gray-900'}`}>
          <Zap size={16} className={syncing ? 'text-blue-500' : 'text-gray-500'} />
        </div>
        <div>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Source Engine</p>
          <p className="text-[10px] text-white font-bold uppercase">{provider} Protocol</p>
        </div>
      </div>

      <button 
        onClick={triggerSync}
        disabled={syncing}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${
          status === 'success' ? 'bg-green-600 text-white' : 
          status === 'error' ? 'bg-red-600 text-white' : 
          'bg-white text-black hover:bg-gray-200'
        }`}
      >
        {syncing ? <RefreshCw size={12} className="animate-spin" /> : null}
        {status === 'success' ? <CheckCircle size={12} /> : status === 'error' ? <AlertTriangle size={12} /> : null}
        {syncing ? 'Ingesting...' : status === 'success' ? 'Synced' : status === 'error' ? 'Retry' : 'Force Sync'}
      </button>
    </div>
  )
}
