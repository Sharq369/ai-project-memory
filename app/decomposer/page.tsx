"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Zap, ChevronRight, Loader2, FileCode, CheckCircle, Save, 
  Copy, Check, BrainCircuit, ShieldCheck, AlertCircle 
} from 'lucide-react';
import puter from "@heyputer/puter.js"; 

// =======================
// PHASE 1: REQUIREMENTS EXTRACTION
// =======================
const PHASE_1_PROMPT = `You are an elite Technical Product Manager.
Analyze the PRD and extract:
1. ALL explicitly mentioned technologies (NO assumptions)
2. Frontend requirements
3. Backend requirements

STRICT RULES:
- DO NOT hallucinate technologies
- DO NOT add common SaaS tools
- ONLY extract what is explicitly written

Return ONLY valid JSON:
{
  "allowed_technologies": ["Tech 1", "Tech 2"],
  "frontend": ["Feature 1"],
  "backend": ["Requirement 1"]
}`;

// =======================
// PHASE 2: BACKEND GENERATION
// =======================
const BACKEND_PROMPT = `You are a strict Backend Architect.
Decompose requirements into atomic backend tasks.

STRICT RULES:
0. SETUP PHASE (MANDATORY FIRST): Initialize Node.js, folder structure, env vars, DB connection.
1. NO FRONTEND TASKS
2. ATOMIC TASKS (MANDATORY): Split ALL CRUD (POST, GET, PUT, DELETE).
3. DEPENDENCIES: Each task depends ONLY on what it needs.
4. ERROR HANDLING (MANDATORY): Input validation, auth failure, API errors.
5. PHASES: Phase 1: Setup, Phase 2: Core Backend, Phase 3: Integration.
6. NO HALLUCINATED TECH: Only use ALLOWED_TECH.

Return ONLY valid JSON array:
[
  {
    "step_id": "Backend Step 1",
    "title": "",
    "phase": "",
    "depends_on": [],
    "goal": "",
    "tasks": [],
    "requirements": [],
    "output": ""
  }
]`;

// =======================
// PHASE 3: FRONTEND GENERATION
// =======================
const FRONTEND_PROMPT = `You are a strict Frontend Architect.
Decompose into frontend tasks.

STRICT RULES:
0. SETUP PHASE (MANDATORY FIRST): Initialize Next.js, TailwindCSS, routing.
1. NO BACKEND TASKS
2. CROSS-LAYER DEPENDENCIES: You are given backend pipeline. If using API/auth → MUST reference exact Backend Step ID.
3. ATOMIC TASKS: Each task = ONE UI or interaction.
4. ERROR HANDLING: loading states, error boundaries, API failure UI.
5. PHASES: Phase 1: Setup, Phase 2: Foundation, Phase 3: Features, Phase 4: Integration.
6. NO HALLUCINATED TECH.

Return ONLY valid JSON array.`;

// =======================
// PHASE 4: VALIDATION
// =======================
const VALIDATION_PROMPT = `You are a strict system validator.
Validate and FIX the pipeline.

RULES:
1. No duplicate step_ids
2. All dependencies must exist
3. No fake linear dependencies
4. Tasks must be atomic
5. Only allowed technologies used
6. No frontend/backend mixing

Return corrected JSON only.`;

// =======================
// UTILITIES
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
      content += `### ${task.step_id}: ${task.title}\n`;
      content += `**Pipeline:** ${type}\n**Phase:** ${task.phase}\n`;
      content += `**depends_on:** [${(task.depends_on || []).join(', ')}]\n`;
      content += `**Goal:** ${task.goal}\n**Tasks:**\n${(task.tasks || []).map((t: string) => `- ${t}`).join('\n')}\n`;
      content += `**Requirements:** ${(task.requirements || []).join(', ')}\n**Output:** ${task.output}\n\n---\n\n`;
    });
    return { fileName: `${type}-pipeline-pt${index + 1}.md`, content };
  });
}

// =======================
// MAIN COMPONENT
// =======================
export default function DecomposerPage() {
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
      // 1. Extract requirements
      const p1 = await puter.ai.chat(`${PHASE_1_PROMPT}\n\n${prd}`);
      const req = JSON.parse(String(p1).replace(/```json|```/g, '').trim());

      // 2. Backend & Validate
      const bRaw = await puter.ai.chat(`${BACKEND_PROMPT}\n\nALLOWED_TECH:${JSON.stringify(req.allowed_technologies)}\n${JSON.stringify(req.backend)}`);
      let backend = JSON.parse(String(bRaw).replace(/```json|```/g, '').trim());
      
      const bVal = await puter.ai.chat(`${VALIDATION_PROMPT}\n${JSON.stringify(backend)}`);
      backend = JSON.parse(String(bVal).replace(/```json|```/g, '').trim());

      // 3. Frontend & Validate (Passing Backend context)
      const fRaw = await puter.ai.chat(`${FRONTEND_PROMPT}\n\nBACKEND:\n${JSON.stringify(backend)}\n${JSON.stringify(req.frontend)}`);
      let frontend = JSON.parse(String(fRaw).replace(/```json|```/g, '').trim());
      
      const fVal = await puter.ai.chat(`${VALIDATION_PROMPT}\n${JSON.stringify(frontend)}`);
      frontend = JSON.parse(String(fVal).replace(/```json|```/g, '').trim());

      // 4. Sort & Compile
      setFiles([
        ...compileMarkdown('backend', chunkTasks(sortTasks(backend), 20)),
        ...compileMarkdown('frontend', chunkTasks(sortTasks(frontend), 20))
      ]);

    } catch (err) {
      console.error(err);
      setError('Analysis failed. The AI returned invalid JSON. Please try simplifying your PRD text.');
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
      
      // FIXED: Inserts directly into 'memories' using only the 'content' field. 
      // It will instantly appear in the Memories feed as "Unassigned".
      const { error } = await supabase.from('memories').insert({
        user_id: user.id,
        content: `**PRD DECOMPOSITION PIPELINE**\n\n${masterContent}`,
        project_id: null 
      });

      if (error) throw error;
      alert('Pipeline successfully saved to Memories Vault!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // FIX: pt-28 (112px) guarantees the title clears your fixed 64px mobile header
    <div className="relative pt-28 lg:pt-12 pb-20 px-4 max-w-5xl mx-auto w-full z-10">
      <div className="p-8 rounded-3xl border border-white/10 bg-[#0f1117]/80 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <BrainCircuit className="text-blue-500 w-8 h-8" />
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">PRD Decomposer v2</h2>
        </div>

        <p className="text-sm text-gray-400 mb-6">Paste your Product Requirements Document below. The AI will extract allowed technologies and generate strict, dependency-aware architectural pipelines.</p>

        <textarea 
          value={prd}
          onChange={(e) => setPrd(e.target.value)}
          className="w-full h-64 p-6 bg-black/50 border border-white/10 rounded-2xl font-mono text-sm text-gray-300 focus:border-blue-500 transition-all mb-6 outline-none"
          placeholder="Paste PRD..."
        />

        {error && <div className="flex items-center gap-2 text-red-400 mb-4 text-sm font-bold bg-red-400/10 p-3 rounded-lg"><AlertCircle size={16}/> {error}</div>}

        <button 
          onClick={handleDecompose} 
          disabled={loading || !prd}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {loading ? <><Loader2 className="animate-spin" /> Analyzing Layers...</> : <>Run Deep Analysis <ChevronRight size={20}/></>}
        </button>

        {files.length > 0 && (
          <div className="mt-12 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="flex items-center gap-2 text-green-400 font-bold uppercase text-xs tracking-widest"><ShieldCheck size={18}/> Validation Passed</span>
              <button onClick={handleSaveToMemory} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase transition-all">
                {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Save to Vault
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
                <pre className="p-6 text-xs font-mono text-gray-400 overflow-x-auto leading-relaxed">{file.content}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
