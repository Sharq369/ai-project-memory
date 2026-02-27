import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Supabase & Gemini
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role for backend access
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { query, projectId } = await req.json();

    if (!query || !projectId) {
      return NextResponse.json({ error: "Missing Neural Parameters" }, { status: 400 });
    }

    // 1. FETCH VERIFIED MEMORIES ONLY
    // We only pull memories that have been "Sealed" to ensure 100% code accuracy.
    const { data: memories, error } = await supabase
      .from('code_memories')
      .select('file_name, content, deployment_platform')
      .eq('project_id', projectId)
      .eq('is_verified', true);

    if (error) throw error;

    // 2. CONSTRUCT GROUNDED CONTEXT
    const contextString = memories?.length 
      ? memories.map(m => `### FILE: ${m.file_name}\nPLATFORM: ${m.deployment_platform}\nCONTENT:\n${m.content}`).join('\n\n---\n\n')
      : "No verified memories found for this node yet.";

    // 3. INITIALIZE THE NEURAL MODEL
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      YOU ARE THE "NEURAL TERMINAL" FOR A VIBE CODER.
      
      YOUR SOURCE OF TRUTH:
      The following code blocks are "VERIFIED SUCCESSES." They have been deployed and confirmed working.
      If the user asks for changes, you MUST base your logic on these existing blocks.
      
      CONTEXT BLOCKS:
      ${contextString}
      
      STRICT RULES:
      1. If a user asks to modify a file listed above, reference it by name using [[filename]].
      2. If the user's request contradicts the verified context, warn them but offer the solution.
      3. Keep responses concise, technical, and aligned with the "Vibe Coder" aesthetic.
    `;

    // 4. GENERATE GROUNDED RESPONSE
    const result = await model.generateContent([systemPrompt, query]);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });

  } catch (err: any) {
    console.error("Neural Terminal Failure:", err);
    return NextResponse.json({ error: "Neural Link Disrupted: " + err.message }, { status: 500 });
  }
}
