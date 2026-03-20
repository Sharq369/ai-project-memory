"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Zap, ChevronRight, Loader2, FileCode, CheckCircle, Save } from 'lucide-react';
import puter from "@heyputer/puter.js"; 

// UPGRADED PHASE 1: Extract requirements AND allowed tech
const PHASE_1_PROMPT = `You are an elite Technical Product Manager. 
Analyze the provided PRD content and extract the core requirements and ALL explicitly mentioned technologies.
Do NOT assume generic SaaS tools (like Stripe or Mixpanel) unless explicitly written in the PRD.
You MUST respond with strictly valid JSON only. Do not wrap in markdown blocks like \`\`\`json.

Expected JSON format:
{
  "allowed_technologies": ["Tech 1", "Tech 2"],
  "frontend": ["Feature 1", "Feature 2"],
  "backend": ["Requirement 1", "Requirement 2"]
}`;

// UPGRADED PHASE 2: Strict Architecture & Dependency Engine
const PHASE_2_PROMPT = `You are an elite System Architect. 
Decompose the provided list of requirements into strict, dependency-aware, and fully atomic implementation steps.

CRITICAL RULES:
1. NO HALLUCINATED TECH: Only use the technologies provided in the "ALLOWED_TECH" list.
2. ATOMICITY: Each step must be ONE completable task. Split UI and API into separate steps.
3. BACKEND-FIRST: Backend API/DB steps MUST exist and be referenced in the "depends_on" array of Frontend steps that consume them.

PHASES:
- Phase 1: Setup (Init, DB, Auth)
- Phase 2: Core Backend (APIs, Logic)
- Phase 3: Frontend Foundation (Layout, Base Components)
- Phase 4: Feature Implementation (UI, Dashboards)
- Phase 5: Integration

You MUST respond with strictly valid JSON only (an array of objects). Do not wrap in markdown blocks like \`\`\`json.
Expected JSON format:
[
  {
    "step_id": "Step 1",
    "title": "Setup Database Schema",
    "phase": "Phase 1: Setup",
    "depends_on": [],
    "goal": "Clear objective",
    "tasks": ["Specific implementation step 1", "Specific implementation step 2"],
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

// FORMATTER: Converts the strict JSON into the required Markdown Spec
function compileMarkdown(type: 'frontend' | 'backend', chunks: any[][]) {
  return chunks.map((chunk, index) => {
    let content = `# ${type.toUpperCase()} Implementation Pipeline - Part ${index + 1}\n\n`;
    chunk.forEach((task: any) => {
      content += `### ${task.step_id || 'Step X'}: ${task.title || 'Untitled'}\n`;
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleDecompose = async () => {
    setLoading(true);
    setError('');
    setFiles([]);
    
    try {
      // Phase 1: Extract Requirements and Tech
      const phase1Res = await puter.ai.chat(
        `${PHASE_1_PROMPT}\n\nPRD CONTENT:\n${prd}`, 
        { model: 'gpt-4o' }
      );
      
      const phase1Text = typeof phase1Res === 'string' 
        ? phase1Res 
        : (phase1Res as any)?.message?.content || String(phase1Res);
        
      const cleanPhase1 = phase1Text.replace(/```json|```/g, '').trim();
      const requirements = JSON.parse(cleanPhase1);
      const allowedTech = requirements.allowed_technologies || [];

      // Phase 2: Decompose Frontend
      const frontendRes = await puter.ai.chat(
        `${PHASE_2_PROMPT}\n\nALLOWED_TECH: ${JSON.stringify(allowedTech)}\n\nREQUIREMENTS:\n${JSON.stringify(requirements.frontend || [])}`, 
        { model: 'gpt-4o' }
      );
      
      // Phase 2: Decompose Backend
      const backendRes = await puter.ai.chat(
        `${PHASE_2_PROMPT}\n\nALLOWED_TECH: ${JSON.stringify(allowedTech)}\n\nREQUIREMENTS:\n${JSON.stringify(requirements.backend || [])}`, 
        { model: 'gpt-4o' }
      );

      const frontendText = typeof frontendRes === 'string' 
        ? frontendRes 
        : (frontendRes as any)?.message?.content || String(frontendRes);
        
      const backendText = typeof backendRes === 'string' 
        ? backendRes 
        : (backendRes as any)?.message?.content || String(backendRes);

      const frontendTasks = JSON.parse(frontendText.replace(/```json|```/g, '').trim());
      const backendTasks = JSON.parse(backendText.replace(/```json|```/g, '').trim());

      const frontendChunks = chunkTasks(frontendTasks, 20);
      const backendChunks = chunkTasks(backendTasks, 20);

      const generatedFiles = [
        ...compileMarkdown('backend', backendChunks), // Render backend first naturally
        ...compileMarkdown('frontend', frontendChunks)
      ];

      setFiles(generatedFiles);
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

      // Combine all files into one master document for the vault
      const masterContent = files.map(f => `## ${f.fileName}\n\n${f.content}`).join('\n\n');

      const { error } = await supabase.from('code_memories').insert({
        user_id: user.id,
        project_id: null, // Global memory, or link to a specific project if you have a selector
        file_path: `prd_decompositions/pipeline_${new Date().getTime()}.md`,
        content: masterContent,
        summary: `PRD Architecture Pipeline generated on ${new Date().toLocaleDateString()}`
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

  return (
    // UI FIX: Added pt-20 lg:pt-6 to ensure mobile header doesn't overlap the content
    <div className="p-6 pt-24 lg:pt-6 max-w-5xl mx-auto w-full">
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
              
              {/* NEW SAVE TO MEMORY BUTTON */}
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
                  <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-mono text-gray-400 font-bold">{file.fileName}</span>
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
