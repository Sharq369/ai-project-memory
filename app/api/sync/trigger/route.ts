import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role for backend writes
)

export async function POST(req: Request) {
  try {
    const { repoUrl, projectId, provider } = await req.json()

    // 1. Update the project with the new repo URL and provider
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        repo_url: repoUrl,
        provider: provider,
        last_sync: new Date().toISOString()
      })
      .eq('id', projectId)

    if (updateError) throw updateError

    // 2. Here you would trigger your actual scraping/syncing logic
    // For now, we return success so the UI moves forward
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
