"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, Loader2, Copy, Check, Download,
  BrainCircuit, ShieldCheck, AlertCircle, ArrowLeft, Database, CheckCircle2, X, Lock,
  Upload, Trash2, Cpu, FileText, Paperclip
} from 'lucide-react';

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
  const raw = String(input)
  const attempts = [
    raw,
    raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim(),
    raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/i, '').trim(),
    (raw.match(/(\{[\s\S]*\})/) || [])[1] || '',
    (raw.match(/(\[[\s\S]*\])/) || [])[1] || '',
  ]
  for (const attempt of attempts) {
    if (!attempt) continue
    try { return JSON.parse(attempt) } catch {}
  }
  console.error(`All parse attempts failed in ${context}. Raw:`, raw.slice(0, 300))
  throw new Error(`${context}: AI returned malformed data. Try again or refine your PRD.`)
}

function enforceSchema(tasks: any[], type: 'frontend' | 'backend') {
  if (!Array.isArray(tasks)) return [];
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

const PHASE_1_PROMPT = `CRITICAL: Respond with ONLY a raw JSON object. No explanation. No markdown. No code fences. No prose. Raw JSON only.

You are a senior technical architect performing a deep PRD analysis. Extract every implementation detail. Where the PRD is vague or missing information, YOU MUST infer and fill the gap using engineering best practices. Never leave a category empty.

The JSON object must have exactly these keys:

- "allowed_technologies": array of strings — frameworks, libraries, databases, tools. If PRD is vague, infer sensible defaults based on context.
- "system_phases": always exactly ["Phase 1: Setup", "Phase 2: Core Backend", "Phase 3: Frontend Foundation", "Phase 4: Feature Implementation", "Phase 5: Hardening & Integration"]
- "data_models": array of strings — define EVERY entity with its key fields. Format: "EntityName: field1, field2, field3". If PRD mentions users/projects/payments, define them fully. Add missing but obvious entities.
- "frontend": array of strings — every UI page, component, user flow, state management strategy, loading/error states. Be specific.
- "backend": array of strings — every API endpoint group, data model operation, auth mechanism, payment lifecycle (pending/confirmed/failed/webhook), rate limiting, error handling strategy, security (CORS, Helmet, validation). If PRD mentions auth, specify httpOnly cookie storage. If PRD mentions payments, include webhook + idempotency. If PRD mentions images, include upload→CDN→store URL flow. If PRD mentions search, include keyword+filter+pagination+sort.
- "security_requirements": array of strings — rate limiting, input validation, CORS policy, auth token storage, SQL injection prevention. Never leave empty.
- "error_handling": array of strings — standard API error format, logging strategy, client-side error boundaries.

MANDATORY RULES:
1. data_models must have at least 3 entities with field definitions
2. backend must include: auth flow, at least one CRUD group, error handling, security measures
3. frontend must include: auth state management, loading states, error boundaries
4. If payment is mentioned: include pending/confirmed/failed states + webhook + idempotency key
5. If image upload mentioned: define upload→CDN→store URL→return flow
6. If search mentioned: define keyword search + filters + pagination + sorting

Now analyze this PRD and return the JSON object:

`;

const BACKEND_PROMPT = `You are a senior backend engineer. Generate a complete, production-grade backend implementation pipeline. Every step must be concrete and actionable.

MANDATORY STEP COVERAGE — every pipeline MUST include steps for:
1. Project setup & dependency installation (always BE-1)
2. Database schema — define ALL tables/collections with columns and types
3. Authentication — registration, login, logout. JWT stored in httpOnly cookies ONLY (never localStorage)
4. Authorization middleware — protect routes, check ownership
5. Core CRUD API for every main entity (separate step per entity group)
6. Payment flow (if applicable) — define pending/confirmed/failed states, webhook endpoint with signature verification, idempotency key handling
7. Image/file upload (if applicable) — upload to CDN, store URL in DB, return URL
8. Search & filtering (if applicable) — keyword search, filters, pagination (page+limit), sorting (field+direction)
9. Standard error handling — unified error format
10. Security hardening — rate limiting, input validation, CORS configuration, Helmet headers
11. Logging — request logging, error logging

PHASE ASSIGNMENT (use exactly these strings):
- "Phase 1: Setup" — project init, DB schema, env config
- "Phase 2: Core Backend" — auth, core APIs, middleware
- "Phase 3: Feature Implementation" — advanced features, payments, uploads, search
- "Phase 4: Hardening & Integration" — security, rate limiting, error handling, logging

STRICT RULES:
- Use ONLY the allowed technologies provided
- Minimum 8 steps, maximum 18 steps
- Each step is ONE atomic unit of work
- depends_on must reference real step_ids in this same array
- tasks array: minimum 3 specific implementation actions per step

Return ONLY a raw JSON array. No explanation. No markdown fences. No prose.

Allowed Technologies:
`;

function buildFrontendPrompt(technologies: string[], backendSteps: { id: string; title: string }[], requirements: string[]): string {
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

Return ONLY a raw JSON array with no explanation, no markdown fences.

Context:
- Allowed Technologies: ${JSON.stringify(technologies)}
- Frontend Requirements: ${JSON.stringify(requirements)}
`;
}

const VALIDATION_PROMPT = `You are a pipeline quality auditor. Validate and fix this implementation pipeline. Apply ALL corrections silently — return only the fixed array.

VALIDATION CHECKLIST:
1. All required fields exist: step_id, title, phase, goal, tasks, requirements, output, depends_on
2. No duplicate step_ids — if duplicates found, append -A, -B suffix
3. tasks array has minimum 2 items — if empty or 1 item, expand with logical sub-tasks
4. depends_on only references step_ids that exist in this array
5. phase must be valid
6. output must be a concrete deliverable sentence
7. goal must clearly state what the step achieves
8. No step should combine more than one major concern

CRITICAL: Do NOT remove steps. Do NOT merge steps. Do NOT reduce the array length unless there are true duplicates.

Return ONLY the corrected raw JSON array. No explanation. No markdown fences. No prose.
`;

function downloadMarkdown(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function aiCall(prompt: string, selectedStacks: string[] = [], uploadedFiles: any[] = [], retries = 3): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch('/api/decomposer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, selectedStacks, files: uploadedFiles }),
      });

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
      if (!data.text || data.text.trim().length < 10) throw new Error('Empty or too-short response from AI');

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

const KNOWN_STACKS = [
  'Next.js', 'React', 'Vue.js', 'Nuxt.js', 'Svelte', 'SvelteKit', 'Astro',
  'Angular', 'Remix', 'Vite', 'Tailwind CSS', 'Shadcn/ui', 'Radix UI',
  'Framer Motion', 'Three.js', 'React Native', 'Expo',
  'Node.js', 'Express', 'Fastify', 'Hono', 'Bun', 'Deno',
  'NestJS', 'tRPC', 'GraphQL', 'REST', 'gRPC', 'WebSockets',
  'Supabase', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
  'PlanetScale', 'Neon', 'Turso', 'DynamoDB', 'Cassandra', 'CockroachDB',
  'Drizzle ORM', 'Prisma', 'TypeORM', 'Mongoose',
  'Clerk', 'Auth.js', 'NextAuth', 'Lucia', 'Supabase Auth', 'Firebase Auth',
  'Auth0', 'Cognito', 'Keycloak', 'Passport.js',
  'Vercel', 'Netlify', 'Railway', 'Render', 'Fly.io', 'AWS', 'GCP',
  'Azure', 'Cloudflare Workers', 'Cloudflare Pages', 'DigitalOcean',
  'Heroku', 'Coolify',
  'AWS S3', 'Cloudinary', 'Uploadthing', 'Supabase Storage',
  'Backblaze B2', 'Bunny CDN', 'Cloudflare R2',
  'Stripe', 'NOWPayments', 'Paddle', 'LemonSqueezy', 'Paystack',
  'Flutterwave', 'PayPal', 'Braintree',
  'OpenAI', 'Anthropic Claude', 'Google Gemini', 'Groq', 'Mistral',
  'Hugging Face', 'Replicate', 'Langchain', 'LlamaIndex', 'Pinecone',
  'Weaviate', 'Chroma',
  'Resend', 'SendGrid', 'Mailgun', 'Postmark', 'Twilio', 'Vonage',
  'Pusher', 'Ably', 'Socket.io',
  'Sentry', 'Datadog', 'LogRocket', 'PostHog', 'Mixpanel', 'Amplitude',
  'Better Stack', 'Axiom', 'Grafana', 'Prometheus',
  'GitHub Actions', 'GitLab CI', 'Docker', 'Kubernetes', 'Terraform',
  'Ansible', 'Jenkins', 'CircleCI',
  'Sanity', 'Contentful', 'Strapi', 'Payload CMS', 'Ghost',
  'Directus', 'Hygraph', 'Builder.io',
  'Jest', 'Vitest', 'Playwright', 'Cypress', 'Testing Library',
  'Zustand', 'Redux', 'Jotai', 'React Query', 'SWR', 'Zod',
  'TypeScript', 'GraphQL Codegen', 'Nx', 'Turborepo',
]

const UpgradeModal = ({ isOpen, onClose, reason }: { isOpen: boolean; onClose: () => void; reason: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-blue-500/30 bg-[#0e1117] shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-400" />
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Lock size={24} />
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">{reason}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-[#161b22] hover:bg-gray-800 text-gray-300 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/settings'}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
            >
              Upgrade Plan <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [stackSearch, setStackSearch] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; base64: string }[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  };

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return
    setIsProcessingFiles(true)
    const results: { name: string; type: string; base64: string }[] = []
    for (const file of picked) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      results.push({ name: file.name, type: file.type, base64 })
    }
    setUploadedFiles(prev => [...prev, ...results])
    setIsProcessingFiles(false)
    e.target.value = ''
  }

  const removeFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))

  const handleDecompose = async () => {
    if (!prd.trim() && uploadedFiles.length === 0) { setError('Please enter PRD content or upload a document.'); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in.'); return; }

      const enforceRes = await fetch('/api/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'decomposer_run' })
      });
      const authCheck = await enforceRes.json();

      if (!authCheck.allowed) {
        setUpgradeReason(authCheck.reason);
        setShowUpgrade(true);
        return;
      }
    } catch {
      setError('Could not verify plan limits. Please try again.');
      return;
    }

    setLoading(true); setError(''); setFiles([]); setProgress('Initializing...');

    try {
      setProgress('Phase 1: Analyzing PRD & Reading Uploaded Context...');
      const p1 = await aiCall(PHASE_1_PROMPT + prd, selectedStacks, uploadedFiles);
      const req = safeParse(p1, 'Phase 1');
      if (!req.allowed_technologies || !Array.isArray(req.frontend) || !Array.isArray(req.backend)) {
        throw new Error('Phase 1: PRD analysis returned incomplete data. Make sure your PRD mentions technologies, frontend features, and backend requirements.');
      }

      const dataModels = Array.isArray(req.data_models) ? req.data_models : [];
      const securityReqs = Array.isArray(req.security_requirements) ? req.security_requirements : [];
      const errorHandling = Array.isArray(req.error_handling) ? req.error_handling : [];

      setProgress('Phase 2: Generating Backend Pipeline...');
      const backendContext = [
        `Allowed Technologies: ${JSON.stringify(req.allowed_technologies)}`,
        `Data Models: ${JSON.stringify(dataModels)}`,
        `Security Requirements: ${JSON.stringify(securityReqs)}`,
        `Error Handling Strategy: ${JSON.stringify(errorHandling)}`,
        `Requirements: ${JSON.stringify(req.backend)}`
      ].join('\n\n');
      
      const bRaw = await aiCall(BACKEND_PROMPT + backendContext, selectedStacks, []);
      let backend = enforceSchema(safeParse(bRaw, 'Backend Generation'), 'backend');

      setProgress('Phase 3: Generating Frontend Pipeline...');
      const backendRefs = backend.map((b: any) => ({ id: b.step_id, title: b.title }));
      
      const fRaw = await aiCall(buildFrontendPrompt(req.allowed_technologies, backendRefs, req.frontend), selectedStacks, []);
      let frontend = enforceSchema(safeParse(fRaw, 'Frontend Generation'), 'frontend');

      setProgress('Phase 4: Validating Pipelines...');
      const bVal = await aiCall(VALIDATION_PROMPT + JSON.stringify(backend));
      const validatedBackend = enforceSchema(safeParse(bVal, 'Backend Validation'), 'backend');
      if (validatedBackend.length >= Math.floor(backend.length * 0.8)) backend = validatedBackend;

      const fVal = await aiCall(VALIDATION_PROMPT + JSON.stringify(frontend));
      const validatedFrontend = enforceSchema(safeParse(fVal, 'Frontend Validation'), 'frontend');
      if (validatedFrontend.length >= Math.floor(frontend.length * 0.8)) frontend = validatedFrontend;

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
      showToast('success', 'Pipeline saved to Memory Vault.');
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} reason={upgradeReason} />
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl z-[100] px-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={18} /> Back to Hub
        </button>
        <div className="flex items-center gap-2 text-blue-500">
          <BrainCircuit size={20} />
          <span className="font-black italic text-sm tracking-tighter">TURBO DECOMPOSER (GEMINI)</span>
        </div>
      </nav>

      <div className={`fixed top-6 right-4 left-4 md:left-auto md:w-96 z-[200] transition-all duration-300 ${toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${
          toast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/90 border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            : <AlertCircle size={18} className="text-red-400 shrink-0" />}
          <p className="text-sm font-bold flex-1">{toast.message}</p>
          <button onClick={() => setToast(t => ({ ...t, visible: false }))} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      </div>

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
            placeholder="Paste your PRD here... or upload a document below and leave this empty — the AI will extract context from your file."
          />

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tech Stack</span>
              <span className="text-[9px] text-gray-600 ml-1">— search and select any stack</span>
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                value={stackSearch}
                onChange={e => setStackSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = stackSearch.trim()
                    if (val && !selectedStacks.includes(val)) {
                      setSelectedStacks(prev => [...prev, val])
                    }
                    setStackSearch('')
                  }
                }}
                placeholder="Search stacks or type any custom stack + Enter..."
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-blue-500/40 transition-all font-mono"
              />
              {stackSearch.trim() && !KNOWN_STACKS.includes(stackSearch.trim()) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-600 font-mono">
                  Press Enter to add custom
                </div>
              )}
            </div>

            {stackSearch.trim().length > 0 && (
              <div className="bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden mb-3 max-h-48 overflow-y-auto">
                {KNOWN_STACKS
                  .filter(s => s.toLowerCase().includes(stackSearch.toLowerCase()) && !selectedStacks.includes(s))
                  .slice(0, 20)
                  .map(s => (
                    <button
                      key={s}
                      onClick={() => { setSelectedStacks(prev => [...prev, s]); setStackSearch('') }}
                      className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors font-mono border-b border-white/5 last:border-0"
                    >
                      {s}
                    </button>
                  ))
                }
                {KNOWN_STACKS.filter(s => s.toLowerCase().includes(stackSearch.toLowerCase()) && !selectedStacks.includes(s)).length === 0 && (
                  <div className="px-4 py-3 text-[11px] text-gray-600 font-mono">
                    No match — press Enter to add "{stackSearch.trim()}" as custom stack
                  </div>
                )}
              </div>
            )}

            {selectedStacks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedStacks.map(s => (
                  <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 border border-blue-500/25 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-xl">
                    {s}
                    <button
                      onClick={() => setSelectedStacks(prev => prev.filter(x => x !== s))}
                      className="hover:text-red-400 transition-colors ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setSelectedStacks([])}
                  className="px-3 py-1.5 text-[9px] text-gray-600 hover:text-red-400 font-mono transition-colors"
                >
                  clear all
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Paperclip size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Context Documents</span>
              <span className="text-[9px] text-gray-600 ml-1">— PDF, DOCX, XLSX</span>
            </div>
            <label className={`flex items-center gap-3 px-5 py-3 bg-black/40 border border-dashed border-white/10 hover:border-blue-500/40 rounded-2xl cursor-pointer transition-all group ${isProcessingFiles ? 'opacity-50 pointer-events-none' : ''}`}>
              {isProcessingFiles
                ? <Loader2 size={16} className="animate-spin text-blue-400" />
                : <Upload size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />}
              <span className="text-[11px] text-gray-500 group-hover:text-gray-300 transition-colors font-mono">
                {isProcessingFiles ? 'Processing...' : 'Click to attach documents'}
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.txt,.md"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isProcessingFiles}
              />
            </label>
            {uploadedFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-blue-400 shrink-0" />
                      <span className="text-[11px] font-mono text-gray-300 truncate max-w-[240px]">{f.name}</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
            disabled={loading || (!prd.trim() && uploadedFiles.length === 0)}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
          >
            {loading ? <><Loader2 className="animate-spin" /> Processing...</> : <>Run Neural Extraction <ChevronRight size={20} /></>}
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
                      <button onClick={() => downloadMarkdown(file.fileName, file.content)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg" title="Download as .md file">
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => { navigator.clipboard.writeText(file.content); setCopiedIndex(idx); setTimeout(() => setCopiedIndex(null), 2000); }}
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
