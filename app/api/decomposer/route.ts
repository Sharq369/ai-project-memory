// app/api/decomposer/route.ts
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { prompt, selectedStacks = [], files = [] } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return NextResponse.json({ error: 'Missing or invalid prompt.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured on server.' }, { status: 500 })
    }

    let enrichedContext = "";

    // --- 1. MCP PING TO RENDER ---
    if (selectedStacks.length > 0 || files.length > 0) {
      try {
        const mcpResponse = await fetch('https://decomposer-intel.onrender.com/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stacks: selectedStacks, files: files }),
          signal: AbortSignal.timeout(8000) 
        });

        if (mcpResponse.ok) {
          const mcpData = await mcpResponse.json();
          enrichedContext = mcpData.enrichedContext;
        }
      } catch (mcpError) {
        console.warn('MCP Server asleep or unreachable. Proceeding with standard AI knowledge.');
      }
    }

    // --- 2. PROMPT ASSEMBLY ---
    const finalPrompt = `
You are a Senior Systems Architect and "Vibe Coding" expert. 
Analyze the following project requirements and break them down into a strict execution plan.

${enrichedContext ? `${enrichedContext}\n` : ''}

### USER REQUEST / PRD:
${prompt}
`;

    // --- 3. EXECUTE GEMINI ---
    const genAI = new GoogleGenerativeAI(apiKey)
    let model
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    }

    const result = await model.generateContent(finalPrompt)
    let text = result.response.text()

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'AI returned an empty response. Try again.' }, { status: 502 })
    }

    // Clean up markdown fences
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    return NextResponse.json({ text })

  } catch (error: any) {
    console.error('Decomposer API Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
