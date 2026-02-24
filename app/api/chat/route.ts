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

    const { data: memories } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)

    if (!memories || memories.length === 0) {
      return NextResponse.json({ response: "STRICT MODE: No memory blocks found. Please run the SQL fix in Supabase to enable syncing." })
    }

    const codeContext = memories.map(m => `FILE: ${m.file_name}\nCONTENT:\n${m.content}`).join('\n\n---\n\n')

    const systemPrompt = `
      You are the Neural Terminal. STRICT MODE ENABLED.
      CONTEXT: ${codeContext}
      RULES:
      1. ONLY use the context provided.
      2. Cite files with [[filename.ts]].
      3. If unknown, say DATA MISSING.
    `;

    // CHANGED: Using 'gemini-pro' for maximum stability across all regions
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const result = await model.generateContent([systemPrompt, query])
    const response = await result.response
    const responseText = response.text()

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
