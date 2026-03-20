"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Zap, ChevronRight, Loader2, FileCode, CheckCircle, Save, Copy, Check } from 'lucide-react';
import puter from "@heyputer/puter.js"; 

// PHASE 1: Extract requirements AND allowed tech
const PHASE_1_PROMPT = `You are an elite Technical Product Manager. 
Analyze the PRD and extract core requirements and ALL explicitly mentioned technologies.
Do NOT hallucinate generic SaaS tools.
Respond with strictly valid JSON only.

Expected JSON format:
{
  "allowed_technologies": ["Tech 1", "Tech 2"],
  "frontend": ["Feature 1", "Feature 2"],
  "backend": ["Requirement 1", "Requirement 2"]
}`;

// PHASE 2: Strict Backend Architecture
const BACKEND_PROMPT = `You are a strict Backend Architect. 
Decompose the requirements into atomic, sequential backend tasks (Database, Auth, APIs, Logic).
CRITICAL RULES:
1. NO FRONTEND TASKS.
2. ATOMIC APIs: Break APIs into individual methods (POST, GET, PUT, DELETE).
3. STRICT ORDER: Number steps sequentially (e.g., "Backend Step 1", "Backend Step 2"). NO alternatives.
4. DEPENDENCIES: Step 1 has depends_on: []. Step N must depend on previous steps.
5. NO HALLUCINATED TECH: Only use the ALLOWED_TECH.

Respond with strictly valid JSON only (an array of objects).
Expected JSON format:
[
  {
    "step_id": "Backend Step 1",
    "title": "Setup Database Schema",
    "phase": "Phase 2: Core Backend",
    "depends_on": [],
    "goal": "Clear objective",
    "tasks": ["Specific implementation step"],
    "requirements": ["Tech from allowed list"],
    "output": "Expected result"
  }
]`;

// PHASE 3: Strict Frontend Architecture (Requires Backend Context)
const FRONTEND_PROMPT = `You are a strict Frontend Architect. 
Decompose the requirements into atomic, sequential frontend tasks (UI, State, Pages, API Consumption).
CRITICAL RULES:
1. NO BACKEND TASKS.
2. CROSS-LAYER DEPENDENCIES: You are provided the completed BACKEND PIPELINE. If a frontend task consumes an API or Auth, its "depends_on" array MUST include the exact "Backend Step X" ID from the provided backend pipeline.
3. STRICT ORDER: Number steps sequentially (e.g., "Frontend Step 1", "Frontend Step 2"). NO alternatives.
4. NO HALLUCINATED TECH: Only use the ALLOWED_TECH.

Respond with strictly valid JSON only (an array of objects).
Expected JSON format:
[
  {
    "step_id": "Frontend Step 1",
    "title": "Create Dashboard UI",
    "phase": "Phase 3: Frontend Foundation",
    "depends_on": ["Backend Step 2"], 
    "goal": "Clear objective",
    "tasks": ["Specific implementation step"],
    "requirements": ["Tech from allowed list"],
    "output": "Expected result"
  }
]`;

function chunkTasks(tasks: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < tasks.length; i += size) {
    chunks.push(tasks.slice(i, i + size));
  }
  return chunks;
}

// FORMATTER: Converts JSON to Markdown
function compileMarkdown(type: 'frontend' | 'backend', chunks: any[][]) {
  return chunks.map((chunk, index) => {
    let content = `# ${type.toUpperCase()} Implementation Pipeline - Part ${index + 1}\n\n`;
    chunk.forEach((task: any) => {
      content += `### ${task.step_id || 'Step X'}: ${task.title || 'Untitled'}\n`;
      content += `**Pipeline:** ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
      content += `**Phase:** ${task.phase || 'Unassigned'}\n`;
      content += `**depends_on:** [${(task.depends_on || []).join(', ')}]\n`;
      content += `**Goal:** ${task.goal || ''}\n`;
      content += `**Tasks:**\n${(task.tasks || []).map((t: string) => `- ${t}`).join('\n')}\n`;
      content += `**Requirements:** ${(task.requirements || []).join(', ')}\n`;
      content += `**Output:** ${task.output || ''}\n\n`;
      content += `---\n\n`;
    });
    return { fileName: `${type}-pipeline-pt${index + 1}.md`, content };
  });
}

export default function DecomposerPage() {
  const [prd, setPrd] = useState('');
  const [files, setFiles] = useState<{fileName: string, content: string}[]>([]);
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
      // 1. Extract Requirements
      const phase1Res = await puter.ai.chat(`${PHASE_1_PROMPT}\n\nPRD CONTENT:\n${prd}`, { model: 'gpt-4o' });
      const cleanPhase1 = (typeof phase1Res === 'string' ? phase1Res : (phase1Res as any)?.message?.content || String(phase1Res)).replace(/```json|```/g, '').trim();
      const requirements = JSON.parse(cleanPhase1);
      const allowedTech = requirements.allowed_technologies || [];

      // 2. Build Backend First
      const backendRes = await puter.ai.chat(
        `${BACKEND_PROMPT}\n\nALLOWED_TECH: ${JSON.stringify(allowedTech)}\n\nBACKEND REQUIREMENTS:\n${JSON.stringify(requirements.backend || [])}`, 
        { model: 'gpt-4o' }
      );
      const cleanBackend = (typeof backendRes === 'string' ? backendRes : (backendRes as any)?.message?.content || String(backendRes)).replace(/```json|```/g, '').trim();
      const backendTasks = JSON.parse(cleanBackend);

      // 3. Build Frontend (Passing Backend JSON for cross-layer dependencies)
      const frontendRes = await puter.ai.chat(
        `${FRONTEND_PROMPT}\n\nALLOWED_TECH: ${JSON.stringify(allowedTech)}\n\nCOMPLETED BACKEND PIPELINE (For Dependency Mapping):\n${JSON.stringify(backendTasks)}\n\nFRONTEND REQUIREMENTS:\n${JSON.stringify(requirements.frontend || [])}`, 
        { model: 'gpt-4o' }
      );
      const cleanFrontend = (typeof frontendRes === 'string' ? frontendRes : (frontendRes as any)?.message?.content || String(frontendRes)).replace(/```json|```/g, '').trim();
      const frontendTasks = JSON.parse(cleanFrontend);

      // 4. Compile Output
      const backendChunks = chunkTasks(backendTasks, 20);
      const frontendChunks = chunkTasks(frontendTasks, 20);

      setFiles([
        ...compileMarkdown('backend', backendChunks),
        ...compileMarkdown('frontend', frontendChunks)
      ]);
    } catch (err: any) {
      console.error(err);
      setError('Decomposition Error: Ensure your PRD text is valid and try again. The AI may have output invalid JSON.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToMemory = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to save.");

      const masterContent = files.map(f => `## ${f.fileName}\n\n${f.content}`).join('\n\n');

      // FIXED: Removed the 'summary' column to fix schema crash
      const { error } = await supabase.from('code_memories').insert({
        user_id: user.id,
        project_id: null, 
        file_path: `prd_decompositions/pipeline_${new Date().getTime()}.md`,
        content: masterContent
      });

      if (error) throw error;
      alert('Pipeline successfully saved to Memories Vault!');
    } catch (error: any) {
      console.error('Save failed', error);
      alert(error.message || 'Failed to save to memory.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    // FIXED: Swapped to heavy top margin (mt-20 lg:mt-4) to force content below fixed navbar
    <div className="mt-20 lg:mt-4 p-6 max-w-5xl mx-auto w-full">
      <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-blue-500 w-6 h-6" />
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">PRD Decomposer</h2>
        </div>

        <p className="text-sm text-gray-400 mb-6">Paste your Product Requirements Document below. The AI will extract allowed technologies and generate strict, dependency-aware architectural pipelines.</p>

        <textarea 
          className="w-full h-64 p-5 bg-black/40 border border-white/10 rounded-2xl font-mono text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-colors mb-6 resize-none"
          placeholder="Paste your PRD content here..."
          value={prd}
          onChange={(e) => setPrd(e.target.value)}
        />
        
        {error && <p className="text-red-400 text-sm mb-4 font-medium italic">!! {error}</p>}
        
        <button 
          onClick={handleDecompose}
          disabled={loading || !prd}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Architectural Analysis...
            </>
          ) : (
            <>
              Generate Execution Pipeline
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        {files.length > 0 && (
          <div className="mt-12 space-y-8 border-t border-white/10 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold uppercase text-xs tracking-widest">Pipeline Generated</span>
              </div>
              
              <button 
                onClick={handleSaveToMemory}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-gray-700 hover:border-blue-500 text-sm font-bold text-gray-300 transition-all rounded-lg disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving to Vault...' : 'Save to Memory'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {files.map((file, idx) => (
                <div key={idx} className="rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
                  <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-mono text-gray-400 font-bold">{file.fileName}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleCopy(file.content, idx)}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 active:scale-95"
                    >
                      {copiedIndex === idx ? (
                        <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied</span></>
                      ) : (
                        <><Copy className="w-4 h-4" /><span>Copy</span></>
                      )}
                    </button>
                  </div>
                  
                  <pre className="p-8 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {file.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
