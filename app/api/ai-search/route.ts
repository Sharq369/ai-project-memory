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

    // 3. Fetch from Google Custom Search API
    let webResults: any[] = []
    
    console.log("Checking Env Vars: ", { 
      hasKey: !!process.env.GOOGLE_SEARCH_API_KEY, 
      hasCX: !!process.env.GOOGLE_SEARCH_CX 
    });

    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
      try {
        const googleRes = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}&num=3`
        )
        
        if (googleRes.ok) {
          const googleData = await googleRes.json()
          webResults = googleData.items?.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
          })) || []
          console.log(`Google API Success: Found ${webResults.length} results.`);
        } else {
          // THIS IS THE FIX: Actually read the error Google sends back
          const errorData = await googleRes.json();
          console.error("Google API Rejected the Request:", errorData);
        }
      } catch (e) {
        console.error("Google Search Network Error:", e)
      }
    } else {
      console.warn("Skipping Google Search: Environment variables are missing.");
      }
    
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
