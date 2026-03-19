"use client";

import { useState } from 'react';
import { Zap, ChevronRight, Loader2, FileCode, CheckCircle } from 'lucide-react';
import puter from "@heyputer/puter.js"; 

const PHASE_1_PROMPT = `You are an elite Technical Product Manager. 
Analyze the provided PRD content and extract the core requirements.
You MUST respond with strictly valid JSON only. Do not wrap in markdown blocks like \`\`\`json.

Expected JSON format:
{
  "frontend": ["Feature 1", "Feature 2"],
  "backend": ["Requirement 1", "Requirement 2"]
}`;

const PHASE_2_PROMPT = `You are a Senior Software Engineer. 
Decompose the provided list of requirements into atomic, highly technical implementation tasks.
You MUST respond with strictly valid JSON only. Do not wrap in markdown blocks like \`\`\`json.

Expected JSON format (an array of objects):
[
  {
    "task": "Component Name / Action",
    "description": "Technical implementation details, required props, or API endpoints.",
    "estimated_hours": 2
  }
]`;

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
    chunk.forEach((task: any, i: number) => {
      content += `### [ ] Task ${i + 1}: ${task.task || 'Untitled Task'}\n`;
      content += `**Technical Description:**\n${task.description || 'No description provided.'}\n\n`;
      content += `**Estimated Effort:** ${task.estimated_hours || 0} hours\n\n`;
      content += `---\n\n`;
    });
    return { fileName: `${type}-implementation-pt${index + 1}.md`, content };
  });
}

export default function DecomposerPage() {
  const [prd, setPrd] = useState('');
  const [files, setFiles] = useState<{fileName: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDecompose = async () => {
    setLoading(true);
    setError('');
    
    try {
      const phase1Res = await puter.ai.chat(
        `${PHASE_1_PROMPT}\n\nPRD CONTENT:\n${prd}`, 
        { model: 'gpt-4o' }
      );
      
      const phase1Text = typeof phase1Res === 'string' 
        ? phase1Res 
        : (phase1Res as any)?.message?.content || String(phase1Res);
        
      const cleanPhase1 = phase1Text.replace(/```json|```/g, '').trim();
      const requirements = JSON.parse(cleanPhase1);

      const frontendRes = await puter.ai.chat(
        `${PHASE_2_PROMPT}\n\nREQUIREMENTS:\n${JSON.stringify(requirements.frontend || [])}`, 
        { model: 'gpt-4o' }
      );
      
      const backendRes = await puter.ai.chat(
        `${PHASE_2_PROMPT}\n\nREQUIREMENTS:\n${JSON.stringify(requirements.backend || [])}`, 
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
        ...compileMarkdown('frontend', frontendChunks),
        ...compileMarkdown('backend', backendChunks)
      ];

      setFiles(generatedFiles);
    } catch (err: any) {
      console.error(err);
      setError('Decomposition Error: Ensure your PRD text is valid and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-yellow-400 w-6 h-6" />
          <h2 className="text-2xl font-bold tracking-tight text-white">PRD Decomposer</h2>
        </div>

        <textarea 
          className="w-full h-64 p-5 bg-black/40 border border-white/10 rounded-2xl font-mono text-sm text-gray-300 focus:outline-none focus:border-white/20 transition-colors mb-6 resize-none"
          placeholder="Paste your PRD content here..."
          value={prd}
          onChange={(e) => setPrd(e.target.value)}
        />
        
        {error && <p className="text-red-400 text-sm mb-4 font-medium italic">!! {error}</p>}
        
        <button 
          onClick={handleDecompose}
          disabled={loading || !prd}
          className="w-full flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-gray-200 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing with OpenAI via Puter...
            </>
          ) : (
            <>
              Generate Build Steps
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        {files.length > 0 && (
          <div className="mt-12 space-y-10 border-t border-white/10 pt-10">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-bold uppercase text-xs tracking-widest">Decomposition Successful</span>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {files.map((file, idx) => (
                <div key={idx} className="rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
                  <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-mono text-gray-400 font-bold">{file.fileName}</span>
                  </div>
                  <pre className="p-8 text-sm font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
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
