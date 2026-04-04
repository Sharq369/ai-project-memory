// app/api/decomposer/route.ts
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    // 1. We now accept 'prompt', 'selectedStacks', and 'files' (base64) from your frontend
    const { prompt, selectedStacks = [], files = [] } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return NextResponse.json({ error: 'Missing or invalid prompt.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured on server.' }, { status: 500 })
    }

    // 2. --- THE MCP PING (Calling your new Decomposer-Intel on Render) ---
    let enrichedContext = "";
    // Only ping Render if we actually have stacks or files to process
    if (selectedStacks.length > 0 || files.length > 0) {
      try {
        console.log("Pinging Decomposer-Intel MCP...");
        const mcpResponse = await fetch('https://decomposer-intel.onrender.com/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stacks: selectedStacks, files: files }),
          // 8-second timeout: Protects Vercel from crashing if Render is sleeping
          signal: AbortSignal.timeout(8000) 
        });

        if (mcpResponse.ok) {
          const mcpData = await mcpResponse.json();
          enrichedContext = mcpData.enrichedContext;
          console.log("MCP Intelligence successfully retrieved!");
        } else {
          console.warn("MCP Warning - Status:", mcpResponse.status);
        }
      } catch (mcpError) {
        console.warn('MCP Server asleep or unreachable. Proceeding with standard AI knowledge.');
      }
    }

    // 3. --- PROMPT ASSEMBLY ---
    const finalPrompt = `
You are a Senior Systems Architect and "Vibe Coding" expert. 
Analyze the following project requirements and break them down into a strict execution plan.

${enrichedContext ? `${enrichedContext}\n` : ''}

### USER REQUEST / PRD:
${prompt}
`;

    // 4. --- EXECUTE GEMINI ---
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

    // Clean up markdown
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
