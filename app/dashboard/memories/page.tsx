"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Brain, Plus, Lock, AlertTriangle, X, ArrowRight, Save, Loader2 } from 'lucide-react';

// ------------------------------------------------------------------
// 1. SUPABASE SETUP
// ------------------------------------------------------------------
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ------------------------------------------------------------------
// 2. UPGRADE MODAL COMPONENT (The Gatekeeper UI)
// ------------------------------------------------------------------
const UpgradeModal = ({ isOpen, onClose, reason, plan }: { isOpen: boolean, onClose: () => void, reason: string, plan: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030308]/80 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-fuchsia-500/30 bg-[#0b0b16] shadow-[0_0_40px_-10px_rgba(217,70,239,0.3)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-600 to-cyan-400" />
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
              <Lock size={24} />
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Vault Capacity Reached</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{reason}</p>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard/billing'} // Route to your Stripe/Billing page
              className="flex-1 px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)]"
            >
              Upgrade Plan <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 3. MAIN MEMORIES PAGE
// ------------------------------------------------------------------
export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [newMemory, setNewMemory] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Modal State
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [currentPlan, setCurrentPlan] = useState("");

  useEffect(() => {
    fetchSessionAndMemories();
  }, []);

  const fetchSessionAndMemories = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      // Fetch existing memories
      const { data } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      setMemories(data || []);
    }
    setLoading(false);
  };

  // ── THE NEW GATEKEEPER LOGIC ──────────────────────────────────────
  const handleSaveMemory = async () => {
    if (!newMemory.trim() || !user) return;
    setIsSaving(true);

    try {
      // 1. Ask the Gatekeeper API First
      const enforceRes = await fetch('/api/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          action: 'add_memory' 
        })
      });

      const authCheck = await enforceRes.json();
      setCurrentPlan(authCheck.plan);

      // 2. Handle Rejection (Show Modal)
      if (!authCheck.allowed) {
        setUpgradeReason(authCheck.reason);
        setShowUpgrade(true);
        setIsSaving(false);
        return; // Stop execution here
      }

      // 3. Proceed with Save if Allowed
      const { data, error } = await supabase
        .from('memories')
        .insert([{ user_id: user.id, content: newMemory }])
        .select()
        .single();

      if (error) throw error;

      // Update UI
      setMemories([data, ...memories]);
      setNewMemory("");

    } catch (err) {
      console.error("Failed to save memory:", err);
      alert("System Error: Could not save memory.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#030308] flex items-center justify-center"><Loader2 className="animate-spin text-fuchsia-500" /></div>;

  return (
    <div className="min-h-screen bg-[#030308] text-slate-200 p-4 md:p-8 font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.03),transparent_50%)] pointer-events-none" />

      {/* The Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        reason={upgradeReason}
        plan={currentPlan}
      />

      <header className="mb-8 max-w-4xl mx-auto flex items-center gap-4 relative z-10">
        <div className="h-10 w-1 bg-gradient-to-b from-cyan-400 to-fuchsia-600 shadow-[0_0_15px_#d946ef]" />
        <div>
          <p className="text-[9px] text-fuchsia-500 font-bold uppercase tracking-[0.2em] mb-1">Data Storage</p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Neural Vault</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Input Area */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0b0b16]/80 backdrop-blur-xl p-1 focus-within:border-fuchsia-500/50 transition-colors">
          <textarea
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Initialize new memory sequence..."
            className="w-full bg-transparent text-slate-200 p-4 min-h-[120px] resize-none focus:outline-none text-sm placeholder:text-slate-600"
          />
          <div className="flex justify-end p-2 border-t border-white/5 bg-black/20">
            <button
              onClick={handleSaveMemory}
              disabled={isSaving || !newMemory.trim()}
              className="px-6 py-2 bg-white/5 hover:bg-fuchsia-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Commit to Vault
            </button>
          </div>
        </div>

        {/* Memories List */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Brain size={14} /> Encoded Sequences ({memories.length})
          </h3>
          
          {memories.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
              <p className="text-slate-500 text-sm">Vault is empty. Awaiting initial data input.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {memories.map((memory) => (
                <div key={memory.id} className="p-5 rounded-xl border border-[#1a1a3a] bg-[#0b0b16]/50 hover:border-cyan-500/30 transition-colors">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{memory.content}</p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>ID: {memory.id.split('-')[0]}</span>
                    <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
