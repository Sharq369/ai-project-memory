import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { query, userId } = await req.json()

    if (!query || !userId) {
      return NextResponse.json({ error: "Missing query or user ID" }, { status: 400 })
    }

    // 1. Initialize Supabase (Service Role to bypass RLS for server-side aggregation, but strictly filtered by userId)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Parallel Fetch: Local Projects & Memories
    const [projRes, memRes] = await Promise.all([
      supabase.from('projects').select('name, description, maturity_score').eq('user_id', userId).ilike('name', `%${query}%`).limit(3),
      supabase.from('memories').select('content, tag, projects(name)').eq('user_id', userId).ilike('content', `%${query}%`).limit(5)
    ])

    const localProjects = projRes.data || []
    const localMemories = memRes.data || []

// --- START OF SEARCH LOGIC ---
    let webResults: any[] = [];

    // 1. PRIMARY ENGINE: Tavily AI (Optimized for LLM reading)
    if (process.env.TAVILY_API_KEY) {
      try {
        console.log("🔍 Attempting Tavily Search...");
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            search_depth: "basic",
            max_results: 3
          })
        });

        if (tavilyRes.ok) {
          const data = await tavilyRes.json();
          webResults = data.results.map((r: any) => ({
            title: r.title,
            link: r.url,
            snippet: r.content
          }));
          console.log(`✅ Tavily Success: Found ${webResults.length} results.`);
        } else {
          // If Tavily returns a 400/500 error (e.g., out of credits), throw to trigger fallback
          throw new Error(`Tavily API error: ${tavilyRes.status}`);
        }
      } catch (tavilyError) {
        console.warn("⚠️ Tavily Failed or Limit Reached. Switching to Serper...", tavilyError);
        
        // 2. FALLBACK ENGINE: Serper.dev (Classic Google Search Clone)
        if (process.env.SERPER_API_KEY) {
          try {
            console.log("🔄 Attempting Serper Fallback...");
            const serperRes = await fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: {
                'X-API-KEY': process.env.SERPER_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ q: query, num: 3 })
            });

            if (serperRes.ok) {
              const data = await serperRes.json();
              // Serper returns results inside an 'organic' array
              webResults = data.organic?.map((r: any) => ({
                title: r.title,
                link: r.link,
                snippet: r.snippet
              })) || [];
              console.log(`✅ Serper Fallback Success: Found ${webResults.length} results.`);
            } else {
              console.error("❌ Serper API error:", serperRes.status);
            }
          } catch (serperError) {
            console.error("❌ Critical: Both Search Providers Failed.", serperError);
          }
        } else {
          console.warn("⚠️ No Serper API Key found for fallback.");
        }
      }
    } else {
      console.error("❌ No Tavily API Key found in Environment Variables.");
    }
    // --- END OF SEARCH LOGIC ---
    
    // Now pass 'webResults' to Gemini exactly as you were doing before!
    
    // 4. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // 5. Construct the Prompt with all 3 Data Sources
    const prompt = `
You are "NeuralVault", an elite AI developer assistant. Answer the user's query using the context below.

USER QUERY: "${query}"

[CONTEXT 1: USER'S LOCAL PROJECTS]
${localProjects.length > 0 ? JSON.stringify(localProjects) : "No matching projects found."}

[CONTEXT 2: USER'S LOCAL MEMORIES/CODE]
${localMemories.length > 0 ? JSON.stringify(localMemories) : "No matching memories found."}

[CONTEXT 3: LIVE WEB RESULTS (GOOGLE)]
${webResults.length > 0 ? JSON.stringify(webResults) : "No web results fetched."}

INSTRUCTIONS:
1. Provide a direct, highly technical, and helpful answer.
2. Synthesize the context: If the answer requires their local code and an external library, combine both into your solution.
3. If you use Web Results, explicitly state "Based on the live web..."
4. Format your response in clean Markdown with code blocks where necessary.
5. If the query is conversational, respond naturally but concisely.
`

    const result = await model.generateContent(prompt)
    const answer = result.response.text()

    // 6. Return the synthesized answer AND the raw sources so the UI can display them
    return NextResponse.json({
      answer,
      sources: {
        projects: localProjects,
        memories: localMemories,
        web: webResults
      }
    })

  } catch (error: any) {
    console.error("AI Search Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
