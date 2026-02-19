import { NextRequest, NextResponse } from 'next/server'
// VERIFIED: 3 levels back to root for Vercel pathing
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { query, projectId } = await request.json()

    if (!query || !projectId) {
      return NextResponse.json({ error: "Missing query or project ID" }, { status: 400 })
    }

    // Using 'plain' search for better mobile fuzzy-matching 
    // and verifying the project_id match
    const { data, error } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)
      .textSearch('content', query, {
        type: 'plain',
        config: 'english'
      })
      .limit(10)

    if (error) {
      console.error("Supabase Search Error:", error)
      throw error
    }

    // Logging for your Vercel logs to see what's happening
    console.log(`Search for "${query}" in project ${projectId} returned ${data?.length} results`)

    return NextResponse.json({ results: data || [] })

  } catch (error: any) {
    console.error("Internal Search API Error:", error.message)
    return NextResponse.json({ 
      error: error.message,
      results: [] 
    }, { status: 500 })
  }
}
