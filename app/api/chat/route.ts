import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { query, projectId } = await req.json()

    // 1. Initialize Supabase with SSR (Respects User Session)
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name) { return cookieStore.get(name)?.value } } }
    )

    // 2. Fetch Code Memories (REMOVED 'is_verified' so it can actually see your sync!)
    const { data: memories, error } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)

    if (error) throw error

    // 3. Construct the Grounded Context
    let contextString = memories?.length 
      ? memories.map(m => `### FILE: ${m.file_name}\n${m.content}`).join('\n\n')
      : "No code files found in this node archive."

    // 4. Initialize Gemini (The Brain)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const systemPrompt = `
      YOU ARE THE "NEURAL TERMINAL" FOR A VIBE CODER.
      YOUR SOURCE OF TRUTH IS THE FOLLOWING CODEBASE:
      
      ${contextString}

      STRICT RULES:
      1. If the user asks for changes, you MUST base your logic on the existing files above.
      2. Keep responses concise, technical, and aligned with the "Vibe Coder" aesthetic.
    `

    // 5. Generate and Return
    const result = await model.generateContent([systemPrompt, query])
    return NextResponse.json({ response: result.response.text() })

  } catch (err: any) {
    return NextResponse.json({ error: "Neural Link Disrupted: " + err.message }, { status: 500 })
  }
}
