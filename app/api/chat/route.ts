import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { query, projectId } = await req.json()

    // 1. Fetch the exact code context from your "Memory Banks"
    const { data: memories, error: memError } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)

    if (memError || !memories || memories.length === 0) {
      return NextResponse.json({ response: "STRICT MODE ERROR: No memory blocks found for this node. Please sync your repository first." })
    }

    // 2. Format the context for the AI
    const codeContext = memories.map(m => `FILE: ${m.file_name}\nCONTENT:\n${m.content}`).join('\n\n---\n\n')

    // 3. The "Strict Mode" System Instruction (The Hardware Leash)
    const systemPrompt = `
      You are the Neural Terminal for project node ${projectId}.
      STRICT MODE IS ENABLED.
      
      YOUR SOURCE OF TRUTH (CONTEXT):
      ${codeContext}
      
      RULES:
      1. ONLY answer based on the provided code blocks above.
      2. If the user asks for logic not found in these blocks, say: "DATA MISSING: This logic is not synced in the current node."
      3. DO NOT suggest external libraries or patterns not found in the context.
      4. DO NOT hallucinate. Stay grounded in the variable names and patterns provided.
      5. CITE YOUR SOURCES: Whenever you reference logic from a file, you MUST include the filename in double brackets, e.g., [[filename.ts]].
    `;

    // 4. Call AI Provider (Using OpenAI format as standard)
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.1 // Keeping it cold to prevent "jumping off"
      })
    })

    const aiData = await aiRes.json()
    
    if (aiData.error) {
        throw new Error(aiData.error.message)
    }

    const responseText = aiData.choices[0].message.content

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error("Neural Terminal Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
