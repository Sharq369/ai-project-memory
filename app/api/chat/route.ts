import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Gemini with your free key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { query, projectId } = await req.json()

    // 1. Fetch memory blocks from Supabase
    const { data: memories, error: memError } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)

    if (memError || !memories || memories.length === 0) {
      return NextResponse.json({ response: "STRICT MODE ERROR: No memory blocks found. Sync your repo first." })
    }

    // 2. Build the Grounding Context
    const codeContext = memories.map(m => `FILE: ${m.file_name}\nCONTENT:\n${m.content}`).join('\n\n---\n\n')

    // 3. Strict Mode Instructions
    const systemPrompt = `
      You are the Neural Terminal. STRICT MODE ENABLED.
      
      CONTEXT FROM DATABASE:
      ${codeContext}
      
      RULES:
      1. ONLY answer using the context provided above.
      2. If the answer isn't there, say "DATA MISSING".
      3. CITE sources using double brackets: [[filename.ts]].
      4. Keep answers concise for a "Vibe Coder" terminal interface.
    `;

    // 4. Generate Content
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Fast and free tier friendly
      generationConfig: { temperature: 0.1 } // Keeps AI grounded
    })

    const result = await model.generateContent([systemPrompt, query])
    const responseText = result.response.text()

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error("Gemini Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
