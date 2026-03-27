"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, Loader2, Copy, Check, Download,
  BrainCircuit, ShieldCheck, AlertCircle, ArrowLeft, Database, CheckCircle2, X, Lock, ArrowRight
} from 'lucide-react';
import Link from 'next/link'; // Added for the upgrade button

// --- KEEP ALL YOUR UTILITY FUNCTIONS (extractJSONBlock, safeParse, etc.) EXACTLY AS THEY ARE ---
// [Existing functions: extractJSONBlock, safeParse, enforceSchema, sortTasks, chunkTasks, compileMarkdown, etc.]

export default function DecomposerPage() {
  const router = useRouter();
  const [prd, setPrd] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({ visible: false, type: 'success', message: '' });

  // 🛡️ NEW GATEKEEPER STATES
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  };

  const handleDecompose = async () => {
    if (!prd.trim()) { setError('Please enter PRD content'); return; }
    
    setLoading(true); 
    setError(''); 
    setFiles([]); 
    setProgress('Checking neural permissions...'); // Updated starting progress

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // 🛡️ STEP 1: SECURITY CHECK (The Bouncer)
      const enforceRes = await fetch('/api/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          action: 'decomposer_run' 
        })
      });
      
      const enforceData = await enforceRes.json();

      if (!enforceData.allowed) {
        setUpgradeReason(enforceData.reason);
        setShowUpgradeModal(true);
        setLoading(false);
        setProgress('');
        return; // HALT - Do not run the expensive AI logic
      }

      // 🚀 STEP 2: START YOUR EXISTING MULTI-PHASE LOGIC
      setProgress('Phase 1: Analyzing PRD...');
      const p1 = await aiCall(PHASE_1_PROMPT + prd);
      const req = safeParse(p1, 'Phase 1');
      
      // ... [REST OF YOUR EXISTING PHASE 1, 2, 3, 4 LOGIC HERE] ...
      // Make sure to use your existing aiCall and safeParse logic

      // 📌 STEP 3: LOG THE SUCCESSFUL RUN (So it counts toward the daily limit)
      await supabase.from('decomposer_log').insert({ user_id: user.id });

      // [Existing logic to set files and clear progress]
      // setFiles([...backendFiles, ...frontendFiles]);
      // setProgress('');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Pipeline failed.');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      {/* ... [KEEP YOUR EXISTING NAV AND TOAST JSX] ... */}

      <main className="pt-28 pb-20 px-4 max-w-5xl mx-auto w-full">
        {/* ... [KEEP YOUR EXISTING HEADER, TEXTAREA, PROGRESS, ERROR, AND BUTTON JSX] ... */}
        
        {/* ... [KEEP YOUR EXISTING FILE GENERATION LIST] ... */}
      </main>

      {/* 🛑 NEW UPGRADE MODAL OVERLAY (Matches your "Architectural" aesthetic) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#111218] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 blur-[80px] rounded-full"></div>
            
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20">
              <Lock className="text-blue-500" size={32} />
            </div>
            
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-3">Neural Limit Reached</h2>
            
            <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl mb-8 text-xs font-mono text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <p>{upgradeReason}</p>
            </div>
            
            <p className="text-gray-500 text-sm leading-relaxed mb-10">
              High-intensity PRD decomposition requires significant GPU resources. Expand your neural capacity to continue building.
            </p>
            
            <div className="flex flex-col gap-4">
              <Link href="/dashboard/settings" className="w-full">
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                  Upgrade Capacity <ArrowRight size={18} />
                </button>
              </Link>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all"
              >
                Return to Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
