import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { query, projectId } = await req.json()

    if (!query || !projectId) {
      return NextResponse.json({ error: 'Missing query or projectId' }, { status: 400 })
    }

    // 1. Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Fetch code memories for this specific project
    const { data: memories, error } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)

    if (error) {
      console.error("Supabase Error:", error)
      throw new Error('Failed to fetch project context from database.')
    }

    // 3. Pre-calculate the exact file count and list for the AI
    let contextString = 'No files synced yet.'
    let fileCount = 0
    let fileNamesList = 'None'

    if (memories && memories.length > 0) {
      fileCount = memories.length
      fileNamesList = memories.map(m => m.file_name).join(', ')
      
      contextString = memories
        .map(m => `### FILE: ${m.file_name}\n\`\`\`\n${m.content}\n\`\`\``)
        .join('\n\n')
    }

    // 4. Initialize Gemini (Using the correct, active model)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // 5. Build the strict System Prompt
    const systemPrompt = `You are the dedicated AI assistant and expert guide for this specific project. 
Your goal is to help the user understand, navigate, and interact with this codebase.

PROJECT FACTS (Use these as absolute truth):
- Total number of files: ${fileCount}
- List of files: ${fileNamesList}

CRITICAL INSTRUCTIONS:
- You are a knowledgeable guide FOR THIS PROJECT ONLY. Discuss it naturally with the user.
- If the user asks for the file count, reply directly with the exact number provided above (${fileCount}). DO NOT try to count the files yourself.
- If the user asks what files are in the project, refer to the list of files provided above.
- Answer coding questions strictly based on the provided CODEBASE CONTEXT.
- If the user asks for code, output the code blocks with clear, technical explanations.

CODEBASE CONTEXT:
${contextString}`

    // 6. Start the chat and send the prompt
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I have reviewed the project context and I am ready to assist." }] }
      ]
    })

    const result = await chat.sendMessage(query)
    const responseText = result.response.text()

    // 7. Return the AI's response to the frontend
    return NextResponse.json({ response: responseText })

  } catch (error: any) {
    console.error("Chat API Error:", error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}
