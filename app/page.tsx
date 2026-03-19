"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Brain, Zap, ChevronRight, Loader2, FileCode, CheckCircle } from 'lucide-react';
import puter from "@heyputer/puter.js"; 

// ==========================================
// INTERNALIZED LOGIC (Bypasses missing files)
// ==========================================
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
// ==========================================


export default function Home() {
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
      
      // SAFELY EXTRACT TEXT FROM PUTER'S CHATRESPONSE OBJECT
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

      // SAFELY EXTRACT TEXT FROM PUTER'S CHATRESPONSE OBJECT
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
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-x-hidden font-sans">
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Brain className="text-black w-5 h-5" />
          </div>
          <span className="font-bold tracking-tighter text-xl uppercase">Project Memory</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="#decomposer" className="hover:text-white transition-colors">Decomposer</Link>
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/login" className="hover:text-white transition-colors">Login</Link>
        </div>

        <Link href="/login" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
          Start Creating
        </Link>
      </nav>

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-20">
        <h1 className="max-w-4xl text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
          Secure. Integrate. <br />
          <span className="text-gray-500 font-medium">AI Memory Vault.</span>
        </h1>

        <p className="max-w-2xl text-gray-400 text-lg md:text-xl mb-12 leading-relaxed">
          The ultra-secure infrastructure for your AI context. <br className="hidden md:block" />
          Store data and decompose PRDs using serverless Puter AI.
        </p>

        <div className="relative w-full max-w-4xl mx-auto group mb-16">
          <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-700" />
          <div className="relative aspect-video rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden">
             <div className="relative">
                <Shield className="w-32 h-32 text-white/20 stroke-[1px]" />
                <Brain className="absolute inset-0 m-auto w-12 h-12 text-white animate-pulse" />
             </div>
             <div className="mt-8 flex flex-col items-center">
                <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-mono flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  SYSTEM_STATUS: ENCRYPTED
                </div>
             </div>
          </div>
        </div>
      </section>

      <section id="decomposer" className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-yellow-400 w-6 h-6" />
            <h2 className="text-2xl font-bold tracking-tight">PRD Decomposer</h2>
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
                  <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
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
      </section>
    </main>
  );
}
