import { NextRequest, NextResponse } from 'next/server'
// VERIFIED: 4 levels back to root from app/api/search/
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { query, projectId } = await request.json()

    // Using Supabase text search on the synced content
    const { data, error } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(5)

    if (error) throw error

    return NextResponse.json({ results: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
