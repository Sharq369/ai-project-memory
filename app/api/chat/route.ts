import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { query, projectId } = await req.json()

    // 1. Fetch memory blocks (Grounding data)
    const { data: memories } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)

    if (!memories || memories.length === 0) {
      return NextResponse.json({ response: "STRICT MODE: No memory blocks found in database. Sync your project first." })
    }

    const codeContext = memories.map(m => `FILE: ${m.file_name}\nCONTENT:\n${m.content}`).join('\n\n---\n\n')

    const systemPrompt = `
      You are the Neural Terminal. STRICT MODE ENABLED.
      YOUR SOURCE OF TRUTH:
      ${codeContext}
      
      RULES:
      1. Use ONLY the provided context. 
      2. If logic is missing, say "DATA MISSING".
      3. Cite files using [[filename.ts]].
      4. Be brief.
    `;

    // 2. Use the stable model ID to prevent the 'Google 404'
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    const result = await model.generateContent(systemPrompt + "\n\nUser Query: " + query)
    const responseText = result.response.text()

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    // Log the actual error to your Vercel logs so we can see it
    console.error("AI Route Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
