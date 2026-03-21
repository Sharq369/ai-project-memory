"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Zap, ChevronRight, Loader2, Save, Copy, Check, 
  BrainCircuit, ShieldCheck, AlertCircle, ArrowLeft, Database
} from 'lucide-react';
import puter from "@heyputer/puter.js"; 

// =======================
// SAFE AI CALL (FREE TIER)
// =======================
async function aiCall(prompt: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      // Reverted to default Puter free tier to bypass 'Low Balance' error
      const res = await puter.ai.chat(prompt);
      return res;
    } catch (e) {
      if (i === retries) throw e;
    }
  }
}

// =======================
// SAFE JSON PARSER
// =======================
function safeParse(input: any) {
  try {
    return JSON.parse(String(input).replace(/```json|```/g, '').trim());
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}

// =======================
// SCHEMA ENFORCER
// =======================
function enforceSchema(tasks: any[], type: 'frontend' | 'backend') {
  return tasks.map((task, index) => {
    const prefix = type === 'frontend' ? 'Frontend Step' : 'Backend Step';
    return {
      step_id: task.step_id || `${prefix} ${index + 1}`,
      title: task.title || 'Untitled Step',
      phase: task.phase || (type === 'frontend' ? 'Phase 2: Foundation' : 'Phase 2: Core Backend'),
      depends_on: Array.isArray(task.depends_on) ? task.depends_on : [],
      goal: task.goal && task.goal.trim() !== '' ? task.goal : 'Define implementation goal',
      tasks: Array.isArray(task.tasks) && task.tasks.length > 0 ? task.tasks : ['Define implementation task'],
      requirements: Array.isArray(task.requirements) ? task.requirements : [],
      output: task.output && task.output.trim() !== '' ? task.output : 'Expected output not defined'
    };
  });
}

// =======================
// SORT & CHUNK TASKS
// =======================
function sortTasks(tasks: any[]) {
  const map = new Map(tasks.map(t => [t.step_id, t]));
  const visited = new Set();
  const result: any[] = [];
  function visit(task: any) {
    if (visited.has(task.step_id)) return;
    visited.add(task.step_id);
    (task.depends_on || []).forEach((dep: string) => { if (map.has(dep)) visit(map.get(dep)); });
    result.push(task);
  }
  tasks.forEach(visit);
  return result;
}

function chunkTasks(tasks: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < tasks.length; i += size) chunks.push(tasks.slice(i, i + size));
  return chunks;
}

function compileMarkdown(type: 'frontend' | 'backend', chunks: any[][]) {
  return chunks.map((chunk, index) => {
    let content = `# ${type.toUpperCase()} Implementation Pipeline - Part ${index + 1}\n\n`;
    chunk.forEach((task: any) => {
      content += `### ${task.step_id}: ${task.title}\n**Pipeline:** ${type}\n**Phase:** ${task.phase}\n**depends_on:** [${(task.depends_on || []).join(', ')}]\n**Goal:** ${task.goal}\n**Tasks:**\n${task.tasks.map((t: string) => `- ${t}`).join('\n')}\n**Requirements:** ${task.requirements.join(', ')}\n**Output:** ${task.output}\n\n---\n\n`;
    });
    return { fileName: `${type}-pipeline-pt${index + 1}.md`, content };
  });
}

// =======================
// PROMPTS
// =======================
const PHASE_1_PROMPT = `Extract ONLY what exists in the PRD. Return JSON: { "allowed_technologies": [], "frontend": [], "backend": [] }`;
const BACKEND_PROMPT = `Generate backend pipeline. RULES: Include Setup first, CRUD must be atomic, Include auth/validation, Use ONLY allowed tech, Min 6 steps. Return JSON array`;
const FRONTEND_PROMPT = `Generate frontend pipeline. RULES: Step 1 = Next.js setup, Min 8 steps, Include UI/auth/dashboard, Include loading/error states, Reference backend steps, No backend logic. Return JSON array`;
const VALIDATION_PROMPT = `Fix pipeline: Ensure all fields exist, Fix dependencies, No duplicates, No empty values. Return JSON only`;

// =======================
// MAIN COMPONENT
// =======================
export default function DecomposerPage() {
  const router = useRouter();
  const [prd, setPrd] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleDecompose = async () => {
    setLoading(true);
    setError('');
    setFiles([]);

    try {
      // Phase 1: Sequential extraction
      const p1 = await aiCall(`${PHASE_1_PROMPT}\n\n${prd}`);
      const req = safeParse(p1);

      // Phase 2 & 3: PARALLEL GENERATION (Massive speed boost)
      const [bRaw, fRaw] = await Promise.all([
        aiCall(`${BACKEND_PROMPT}\n${JSON.stringify(req.backend)}`),
        aiCall(`${FRONTEND_PROMPT}\n${JSON.stringify(req.frontend)}\nBACKEND_REF:${JSON.stringify(req.backend)}`)
      ]);

      let backend = enforceSchema(safeParse(bRaw), 'backend');
      let frontend = enforceSchema(safeParse(fRaw), 'frontend');

      // Phase 4: PARALLEL VALIDATION
      const [bVal, fVal] = await Promise.all([
        aiCall(`${VALIDATION_PROMPT}\n${JSON.stringify(backend)}`),
        aiCall(`${VALIDATION_PROMPT}\n${JSON.stringify(frontend)}`)
      ]);

      backend = enforceSchema(safeParse(bVal), 'backend');
      frontend = enforceSchema(safeParse(fVal), 'frontend');

      if (backend.length < 5) throw new Error("Weak backend pipeline");
      if (frontend.length < 6) throw new Error("Weak frontend pipeline");

      setFiles([
        ...compileMarkdown('backend', chunkTasks(sortTasks(backend), 20)),
        ...compileMarkdown('frontend', chunkTasks(sortTasks(frontend), 20))
      ]);

    } catch (err) {
      console.error(err);
      setError('Pipeline failed. Ensure PRD text is clear and valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToMemory = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth required");
      
      const masterContent = files.map(f => `## ${f.fileName}\n\n${f.content}`).join('\n\n');
      
      const { error } = await supabase.from('memories').insert({
        user_id: user.id,
        content: `**PRD DECOMPOSITION PIPELINE**\n\n${masterContent}`,
        project_id: null 
      });

      if (error) throw error;
      alert('Pipeline successfully synced to Memory Vault!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      {/* INDEPENDENT NAV BAR - Fixes Mobile Menu Issue */}
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl z-[100] px-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={18} /> Back to Hub
        </button>
        <div className="flex items-center gap-2 text-blue-500">
          <BrainCircuit size={20} />
          <span className="font-black italic text-sm tracking-tighter">TURBO DECOMPOSER</span>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 max-w-5xl mx-auto w-full">
        <div className="p-8 rounded-[2rem] border border-white/10 bg-[#111218] shadow-2xl">
          <header className="mb-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Architectural Extractor</h1>
            <p className="text-gray-500 text-sm">Convert plain text into strictly enforced, dependency-aware backend/frontend pipelines.</p>
          </header>

          <textarea value={prd} onChange={(e) => setPrd(e.target.value)} className="w-full h-60 p-6 bg-black/40 border border-white/5 rounded-2xl font-mono text-sm text-blue-100/60 focus:border-blue-500/50 outline-none transition-all mb-6" placeholder="Paste full Product Requirements here..." />
          {error && <div className="flex items-center gap-2 text-red-400 mb-6 bg-red-400/5 p-4 rounded-xl text-xs font-bold"><AlertCircle size={16}/> {error}</div>}

          <button onClick={handleDecompose} disabled={loading || !prd} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
            {loading ? <><Loader2 className="animate-spin" /> Compiling Pipelines...</> : <>Run Neural Extraction <ChevronRight size={20}/></>}
          </button>

          {files.length > 0 && (
            <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="flex items-center gap-2 text-green-400 font-bold uppercase text-[10px] tracking-widest"><ShieldCheck size={16}/> Passed Validation</span>
                <button onClick={handleSaveToMemory} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase transition-all">
                  {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Database size={14}/>} Sync to Memories
                </button>
              </div>
              
              {files.map((file, idx) => (
                <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">{file.fileName}</span>
                    <button onClick={() => { navigator.clipboard.writeText(file.content); setCopiedIndex(idx); setTimeout(()=>setCopiedIndex(null),2000); }} className="text-gray-400 hover:text-white transition-colors">
                      {copiedIndex === idx ? <Check size={16} className="text-green-400"/> : <Copy size={16}/>}
                    </button>
                  </div>
                  <pre className="p-6 text-[11px] font-mono text-gray-400 overflow-x-auto leading-relaxed max-h-96">{file.content}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
