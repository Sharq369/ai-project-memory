import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { query, projectId } = await req.json();

    if (!query || !projectId) {
      return NextResponse.json({ error: 'Missing query or project ID' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch relevant project context from the vault
    const { data: memories, error: dbError } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId);

    if (dbError) throw new Error('Database context retrieval failed.');

    // Assemble the code files into a readable context string
    let contextString = 'No files synced yet.';
    if (memories && memories.length > 0) {
      contextString = memories
        .map(m => `### FILE: ${m.file_name}\n\`\`\`\n${m.content}\n\`\`\``)
        .join('\n\n');
    }

    // 2. The Ruthless "No BS" System Prompt
    const systemPrompt = `You are a senior, highly technical software engineer assisting a colleague.
You are answering questions strictly based on the provided CODEBASE CONTEXT.

CRITICAL INSTRUCTIONS:
- DO NOT use preambles, greetings, or conversational filler.
- NEVER say "Here is the rewritten code", "Certainly!", "Sure thing", or "I can help with that."
- If the user asks for code, output ONLY the code blocks and brief, technical inline comments explaining the changes.
- Do not wrap the code block in unnecessary explanations before or after.
- Be ruthlessly concise, direct, and authoritative. 

CODEBASE CONTEXT:
${contextString}`;

    // 3. Call the AI Provider (Using standard OpenAI-compatible fetch)
    // IMPORTANT: Ensure process.env.OPENAI_API_KEY is set in Vercel!
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Update if you are using a different specific model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.1, // Extremely low temperature forces direct, deterministic, non-creative responses
      })
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      throw new Error(data.error?.message || 'Failed to reach AI Provider.');
    }

    // 4. Return the direct response to the UI
    return NextResponse.json({ response: data.choices[0].message.content });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
