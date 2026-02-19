import { supabase } from '../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { query, projectId } = await req.json()

    if (!query || !projectId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Execute the search using the core client already in your project
    const { data, error } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)
      .ilike('content', `%${query}%`) // Search for keywords inside the code
      .limit(8)

    if (error) throw error

    return NextResponse.json({ results: data })
  } catch (err: any) {
    console.error('Search Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
