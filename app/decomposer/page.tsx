"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Zap, ChevronRight, Loader2, FileCode, CheckCircle,
  Save, Copy, Check, BrainCircuit, ShieldCheck, AlertCircle
} from 'lucide-react';
import puter from "@heyputer/puter.js";

// =======================
// SAFE AI CALL (RETRY)
// =======================
async function aiCall(prompt: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
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
      phase: task.phase || (type === 'frontend'
        ? 'Phase 2: Foundation'
        : 'Phase 2: Core Backend'),
      depends_on: Array.isArray(task.depends_on) ? task.depends_on : [],
      goal: task.goal && task.goal.trim() !== '' ? task.goal : 'Define implementation goal',
      tasks: Array.isArray(task.tasks) && task.tasks.length > 0
        ? task.tasks
        : ['Define implementation task'],
      requirements: Array.isArray(task.requirements) ? task.requirements : [],
      output: task.output && task.output.trim() !== ''
        ? task.output
        : 'Expected output not defined'
    };
  });
}

// =======================
// SORT TASKS (DEPENDENCY ORDER)
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

// =======================
// CHUNK TASKS
// =======================
function chunkTasks(tasks: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < tasks.length; i += size) {
    chunks.push(tasks.slice(i, i + size));
  }
  return chunks;
}

// =======================
// MARKDOWN COMPILER
// =======================
function compileMarkdown(type: 'frontend' | 'backend', chunks: any[][]) {
  return chunks.map((chunk, index) => {
    let content = `# ${type.toUpperCase()} Implementation Pipeline - Part ${index + 1}\n\n`;

    chunk.forEach((task: any) => {
      content += `### ${task.step_id}: ${task.title}\n`;
      content += `**Pipeline:** ${type}\n`;
      content += `**Phase:** ${task.phase}\n`;
      content += `**depends_on:** [${(task.depends_on || []).join(', ')}]\n`;
      content += `**Goal:** ${task.goal}\n`;
      content += `**Tasks:**\n${task.tasks.map((t: string) => `- ${t}`).join('\n')}\n`;
      content += `**Requirements:** ${task.requirements.join(', ')}\n`;
      content += `**Output:** ${task.output}\n\n---\n\n`;
    });

    return {
      fileName: `${type}-pipeline-pt${index + 1}.md`,
      content
    };
  });
}

// =======================
// PROMPTS
// =======================

const PHASE_1_PROMPT = `
Extract ONLY what exists in the PRD.

Return JSON:
{
  "allowed_technologies": [],
  "frontend": [],
  "backend": []
}
`;

const BACKEND_PROMPT = `
Generate backend pipeline.

RULES:
- Include Setup first
- CRUD must be atomic
- Include auth, validation, error handling
- Use ONLY allowed tech
- Min 6 steps

Return JSON array
`;

const FRONTEND_PROMPT = `
Generate frontend pipeline.

RULES:
- Step 1 = Next.js setup
- Min 8 steps
- Include UI, auth, dashboard, analytics, payments
- Include loading + error states
- Reference backend steps when needed
- No backend logic

Return JSON array
`;

const VALIDATION_PROMPT = `
Fix pipeline:
- Ensure all fields exist
- Fix dependencies
- No duplicates
- No empty values

Return JSON only
`;

// =======================
// MAIN COMPONENT
// =======================
export default function DecomposerPage() {
  const [prd, setPrd] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
      // Phase 1
      const p1 = await aiCall(`${PHASE_1_PROMPT}\n\n${prd}`);
      const req = safeParse(p1);

      // Backend
      const bRaw = await aiCall(`${BACKEND_PROMPT}\n${JSON.stringify(req.backend)}`);
      let backend = enforceSchema(safeParse(bRaw), 'backend');

      const bVal = await aiCall(`${VALIDATION_PROMPT}\n${JSON.stringify(backend)}`);
      backend = enforceSchema(safeParse(bVal), 'backend');

      // Frontend
      const fRaw = await aiCall(`${FRONTEND_PROMPT}\n${JSON.stringify(req.frontend)}\nBACKEND:${JSON.stringify(backend)}`);
      let frontend = enforceSchema(safeParse(fRaw), 'frontend');

      const fVal = await aiCall(`${VALIDATION_PROMPT}\n${JSON.stringify(frontend)}`);
      frontend = enforceSchema(safeParse(fVal), 'frontend');

      if (backend.length < 5) throw new Error("Weak backend pipeline");
      if (frontend.length < 6) throw new Error("Weak frontend pipeline");

      setFiles([
        ...compileMarkdown('backend', chunkTasks(sortTasks(backend), 20)),
        ...compileMarkdown('frontend', chunkTasks(sortTasks(frontend), 20))
      ]);

    } catch (err) {
      console.error(err);
      setError('Pipeline failed. AI unstable or PRD unclear.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 px-4 max-w-5xl mx-auto">
      <div className="p-8 rounded-3xl border bg-black/50">
        <h2 className="text-xl font-bold mb-4">PRD Decomposer</h2>

        <textarea
          value={prd}
          onChange={(e) => setPrd(e.target.value)}
          className="w-full h-60 p-4 bg-black border rounded"
        />

        {error && <p className="text-red-400">{error}</p>}

        <button
          onClick={handleDecompose}
          disabled={loading}
          className="mt-4 bg-blue-600 px-6 py-3 rounded"
        >
          {loading ? "Processing..." : "Generate Pipeline"}
        </button>

        {files.map((file, idx) => (
          <div key={idx} className="mt-6">
            <div className="flex justify-between">
              <span>{file.fileName}</span>
              <button onClick={() => {
                navigator.clipboard.writeText(file.content);
                setCopiedIndex(idx);
                setTimeout(() => setCopiedIndex(null), 2000);
              }}>
                {copiedIndex === idx ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 bg-black/70 text-xs overflow-x-auto">
              {file.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
