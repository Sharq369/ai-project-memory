import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { query, projectId } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  // Search logic: Looking for matches in file names or content
  const { data, error } = await supabase
    .from('code_memories')
    .select('file_name, content')
    .eq('project_id', projectId)
    .ilike('content', `%${query}%`) // Case-insensitive keyword search
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ results: data })
}
