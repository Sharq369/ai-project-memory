"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, Loader2, Copy, Check, Download,
  BrainCircuit, ShieldCheck, AlertCircle, ArrowLeft, Database
} from 'lucide-react';

// =======================
// ROBUST JSON EXTRACTOR
// =======================
function extractJSONBlock(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const arrayMatch = text.match(/(\[[\s\S]*\])/);
  if (arrayMatch) return arrayMatch[1].trim();

  const objectMatch = text.match(/(\{[\s\S]*\})/);
  if (objectMatch) return objectMatch[1].trim();

  return text.trim();
}

function safeParse(input: any, context: string): any {
  try {
    const cleaned = extractJSONBlock(String(input));
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(`Parse error in ${context}:`, input);
    throw new Error(`${context}: AI returned malformed data. Try again or refine your PRD.`);
  }
}

// =======================
// SCHEMA ENFORCER
// =======================
function enforceSchema(tasks: any[], type: 'frontend' | 'backend') {
  if (!Array.isArray(tasks)) {
    console.error(`Expected array for ${type}, got:`, tasks);
    return [];
  }

  return tasks.map((task, index) => {
    const prefix = type === 'frontend' ? 'FE' : 'BE';
    return {
      step_id: task.step_id || `${prefix}-${index + 1}`,
      title: task.title || `${type} Step ${index + 1}`,
      phase: task.phase || (type === 'frontend' ? 'Phase 2: UI Development' : 'Phase 2: API Development'),
      depends_on: Array.isArray(task.depends_on) ? task.depends_on : [],
      goal: task.goal?.trim() || 'Implementation goal TBD',
      tasks: Array.isArray(task.tasks) && task.tasks.length > 0 ? task.tasks : ['Define implementation details'],
      requirements: Array.isArray(task.requirements) ? task.requirements : [],
      output: task.output?.trim() || 'Deliverable TBD'
    };
  });
}

// =======================
// TASK PROCESSING
// =======================
function sortTasks(tasks: any[]) {
  const map = new Map(tasks.map(t => [t.step_id, t]));
  const visited = new Set();
  const result: any[] = [];

  function visit(task: any) {
    if (visited.has(task.step_id)) return;
    visited.add(task.step_id);
    (task.depends_on || []).forEach((dep: string) => {
      if (map.has(dep)) visit(map.get(dep));
    });
    result.push(task);
  }

  tasks.forEach(visit);
  return result;
}

function chunkTasks(tasks: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < tasks.length; i += size) {
    chunks.push(tasks.slice(i, i + size));
  }
  return chunks;
}

function compileMarkdown(type: 'frontend' | 'backend', chunks: any[][]) {
  return chunks.map((chunk, index) => {
    let content = `# ${type.toUpperCase()} Implementation Pipeline - Part ${index + 1}\n\n`;
    chunk.forEach((task: any) => {
      content += `## ${task.step_id}: ${task.title}\n`;
      content += `- **Phase:** ${task.phase}\n`;
      content += `- **Dependencies:** ${(task.depends_on || []).join(', ') || 'None'}\n`;
      content += `- **Goal:** ${task.goal}\n\n`;
      content += `### Tasks\n${task.tasks.map((t: string) => `- [ ] ${t}`).join('\n')}\n\n`;
      content += `### Requirements\n${task.requirements.length > 0 ? task.requirements.map((r: string) => `- ${r}`).join('\n') : '- Standard implementation'}\n\n`;
      content += `### Expected Output\n${task.output}\n\n---\n\n`;
    });
    return { fileName: `${type}-pipeline-pt${index + 1}.md`, content };
  });
}

// =======================
// PROMPTS
// =======================
const PHASE_1_PROMPT = `You are a technical architect. Analyze the PRD below and extract:
1. Allowed technologies (frameworks, libraries, databases)
2. Frontend requirements (features, UI components, user flows)
3. Backend requirements (APIs, data models, services, auth)

Return ONLY raw JSON with no explanation, no markdown fences:
{
  "allowed_technologies": ["tech1", "tech2"],
  "frontend": ["feature1 description", "feature2 description"],
  "backend": ["api endpoint description", "service description"]
}

PRD Content:
---

`;

const BACKEND_PROMPT = `Generate a detailed backend implementation pipeline based on the requirements and technologies below.

Rules:
- Step 1 MUST be project setup and dependencies
- Include database schema design
- CRUD operations must be separate steps
- Include authentication/authorization
- Include validation and error handling
- Use ONLY the allowed technologies listed
- Minimum 6 steps, maximum 15 steps
- Each step must have a clear output/deliverable

Return ONLY a raw JSON array with no explanation, no markdown fences:
[
  {
    "step_id": "BE-1",
    "title": "Step Title",
    "phase": "Phase 1: Setup",
    "depends_on": [],
    "goal": "What this step achieves",
    "tasks": ["Specific action 1", "Specific action 2"],
    "requirements": ["Tech requirement 1"],
    "output": "Deliverable artifact"
  }
]

Allowed Technologies:
`;

function buildFrontendPrompt(
  technologies: string[],
  backendSteps: { id: string; title: string }[],
  requirements: string[]
): string {
  return `Generate a detailed frontend implementation pipeline.

Rules:
- Step 1 MUST be Next.js project initialization
- Include component architecture
- Include state management setup
- Include API integration (reference backend steps below)
- Include UI/styling implementation
- Include loading and error states
- NO backend logic (database, auth logic) - only UI calls to APIs
- Minimum 8 steps

Reference these backend steps for API integration:
${JSON.stringify(backendSteps, null, 2)}

Return ONLY a raw JSON array with no explanation, no markdown fences:
[
  {
    "step_id": "FE-1",
    "title": "Step Title",
    "phase": "Phase 1: Foundation",
    "depends_on": [],
    "goal": "What this step achieves",
    "tasks": ["Specific action 1"],
    "requirements": ["Component/Library requirement"],
    "output": "UI deliverable"
  }
]

Context:
- Allowed Technologies: ${JSON.stringify(technologies)}
- Frontend Requirements: ${JSON.stringify(requirements)}
`;
}

const VALIDATION_PROMPT = `Validate and fix this pipeline data. Ensure:
1. All required fields exist (step_id, title, phase, tasks, output)
2. Dependencies reference existing step_ids only
3. No duplicate step_ids
4. Tasks array is not empty
5. All fields are proper non-empty strings

Return ONLY the corrected raw JSON array with no explanation, no markdown fences:
`;

// =======================
// DOWNLOAD HELPER
// =======================
function downloadMarkdown(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// =======================
// SERVER-PROXIED AI CALL
// 429 aware: waits 45s and retries automatically.
// 3s breathing gap between successful calls to avoid RPM burst.
// =======================
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function aiCall(prompt: string, retries = 3): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch('/api/decomposer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      // 429 rate limit — wait 45s then retry
      if (res.status === 429) {
        if (i === retries) throw new Error('Rate limit hit. Wait a minute and try again.');
        await sleep(45000);
        continue;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (!data.text || data.text.trim().length < 10) {
        throw new Error('Empty or too-short response from AI');
      }

      // Breathing gap between successful calls to avoid RPM burst
      await sleep(3000);

      return data.text;
    } catch (e: any) {
      console.error(`Attempt ${i + 1} failed:`, e);
      if (i === retries) throw new Error(e.message || 'AI service failed after all retries');
      await sleep(5000 * (i + 1));
    }
  }

  throw new Error('AI call exhausted all retries');
}

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
  const [progress, setProgress] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleDecompose = async () => {
    if (!prd.trim()) {
      setError('Please enter PRD content');
      return;
    }

    setLoading(true);
    setError('');
    setFiles([]);
    setProgress('Initializing...');

    try {
      // Phase 1
      setProgress('Phase 1: Analyzing PRD...');
      const p1 = await aiCall(PHASE_1_PROMPT + prd);
      const req = safeParse(p1, 'Phase 1');

      if (!req.allowed_technologies || !Array.isArray(req.frontend) || !Array.isArray(req.backend)) {
        throw new Error('Phase 1: PRD analysis returned incomplete data. Make sure your PRD mentions technologies, frontend features, and backend requirements.');
      }

      // Phase 2: Backend
      setProgress('Phase 2: Generating Backend Pipeline...');
      const backendContext = `${JSON.stringify(req.allowed_technologies)}\n\nRequirements:\n${JSON.stringify(req.backend)}`;
      const bRaw = await aiCall(BACKEND_PROMPT + backendContext);
      let backend = enforceSchema(safeParse(bRaw, 'Backend Generation'), 'backend');

      if (backend.length < 5) {
        setProgress('Phase 2: Backend insufficient — retrying...');
        const bRaw2 = await aiCall(BACKEND_PROMPT + backendContext + '\n\nIMPORTANT: You MUST generate at least 6 detailed, distinct steps. Do not combine steps.');
        backend = enforceSchema(safeParse(bRaw2, 'Backend Retry'), 'backend');
      }

      // Phase 3: Frontend
      setProgress('Phase 3: Generating Frontend Pipeline...');
      const backendRefs = backend.map((b: any) => ({ id: b.step_id, title: b.title }));
      const fRaw = await aiCall(buildFrontendPrompt(req.allowed_technologies, backendRefs, req.frontend));
      let frontend = enforceSchema(safeParse(fRaw, 'Frontend Generation'), 'frontend');

      if (frontend.length < 6) {
        setProgress('Phase 3: Frontend insufficient — retrying...');
        const fRaw2 = await aiCall(
          buildFrontendPrompt(req.allowed_technologies, backendRefs, req.frontend) +
          '\n\nIMPORTANT: You MUST generate at least 8 detailed, distinct steps. Do not combine steps.'
        );
        frontend = enforceSchema(safeParse(fRaw2, 'Frontend Retry'), 'frontend');
      }

      // Phase 4: Validation
      setProgress('Phase 4: Validating Pipelines...');

      const bVal = await aiCall(VALIDATION_PROMPT + JSON.stringify(backend));
      const validatedBackend = enforceSchema(safeParse(bVal, 'Backend Validation'), 'backend');
      if (validatedBackend.length >= Math.floor(backend.length * 0.8)) {
        backend = validatedBackend;
      } else {
        console.warn(`Backend validation shrank steps from ${backend.length} to ${validatedBackend.length} — keeping original.`);
      }

      const fVal = await aiCall(VALIDATION_PROMPT + JSON.stringify(frontend));
      const validatedFrontend = enforceSchema(safeParse(fVal, 'Frontend Validation'), 'frontend');
      if (validatedFrontend.length >= Math.floor(frontend.length * 0.8)) {
        frontend = validatedFrontend;
      } else {
        console.warn(`Frontend validation shrank steps from ${frontend.length} to ${validatedFrontend.length} — keeping original.`);
      }

      // Compile
      const backendFiles = compileMarkdown('backend', chunkTasks(sortTasks(backend), 20));
      const frontendFiles = compileMarkdown('frontend', chunkTasks(sortTasks(frontend), 20));

      setFiles([...backendFiles, ...frontendFiles]);
      setProgress('');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Pipeline failed. Ensure PRD text is clear and valid.');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToMemory = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const masterContent = files.map(f => `## ${f.fileName}\n\n${f.content}`).join('\n\n');

      const { error: dbError } = await supabase.from('memories').insert({
        user_id: user.id,
        content: `**PRD DECOMPOSITION PIPELINE**\n\n${masterContent}`,
        project_id: null
      });

      if (dbError) throw dbError;
      alert('Pipeline saved to Memory Vault!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl z-[100] px-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={18} /> Back to Hub
        </button>
        <div className="flex items-center gap-2 text-blue-500">
          <BrainCircuit size={20} />
          <span className="font-black italic text-sm tracking-tighter">TURBO DECOMPOSER (GEMINI)</span>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 max-w-5xl mx-auto w-full">
        <div className="p-8 rounded-[2rem] border border-white/10 bg-[#111218] shadow-2xl">
          <header className="mb-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Architectural Extractor</h1>
            <p className="text-gray-500 text-sm">Convert PRD into dependency-aware implementation pipelines.</p>
          </header>

          <textarea
            value={prd}
            onChange={(e) => setPrd(e.target.value)}
            className="w-full h-60 p-6 bg-black/40 border border-white/5 rounded-2xl font-mono text-sm text-blue-100/60 focus:border-blue-500/50 outline-none transition-all mb-4 resize-none"
            placeholder="Paste your Product Requirements Document (PRD) here... Be specific about features, tech stack, and requirements."
          />

          {progress && (
            <div className="flex items-center gap-2 text-blue-400 mb-4 text-xs font-mono">
              <Loader2 size={14} className="animate-spin" /> {progress}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-red-400 mb-6 bg-red-400/5 p-4 rounded-xl text-xs font-bold border border-red-400/10">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="uppercase tracking-wider mb-1 text-red-300">Pipeline Error</div>
                <div className="font-mono font-normal leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleDecompose}
            disabled={loading || !prd.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
          >
            {loading ? (
              <><Loader2 className="animate-spin" /> Processing...</>
            ) : (
              <>Run Neural Extraction <ChevronRight size={20} /></>
            )}
          </button>

          {files.length > 0 && (
            <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="flex items-center gap-2 text-green-400 font-bold uppercase text-[10px] tracking-widest">
                  <ShieldCheck size={16} /> {files.length} Files Generated
                </span>
                <button
                  onClick={handleSaveToMemory}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[11px] font-black uppercase transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Database size={14} />}
                  {isSaving ? 'Saving...' : 'Sync to Memories'}
                </button>
              </div>

              {files.map((file, idx) => (
                <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
                  <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider font-bold">{file.fileName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => downloadMarkdown(file.fileName, file.content)}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                        title="Download as .md file"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(file.content);
                          setCopiedIndex(idx);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === idx ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <pre className="p-6 text-[11px] font-mono text-gray-400 overflow-x-auto leading-relaxed max-h-96 whitespace-pre-wrap">{file.content}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
