import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // 1. CLEAN THE URL (Removes .git and extra slashes)
    const cleanUrl = url.trim().replace(/\.git$/, '').replace(/\/$/, '')
    const parts = cleanUrl.split('/')
    const repo = parts.pop()
    const owner = parts.pop()

    // 2. FETCH (Public repos still need a token for higher rate limits)
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `GitHub Error: ${response.statusText}` }, { status: 404 })
    }
    
    const files = await response.json()

    // 3. MAP THE BLOCKS
    const blocks = await Promise.all(
      files.filter((f: any) => f.type === 'file').slice(0, 10).map(async (file: any) => {
        const res = await fetch(file.download_url)
        const text = await res.text()
        return {
          project_id: projectId,
          file_name: file.name,
          content: text.substring(0, 5000),
          user_id: "public-sync-user" // Ensuring a fallback user_id for the RLS policy
        }
      })
    )

    // 4. UPSERT (This stops the "duplicate key" error forever)
    const { error } = await supabaseAdmin
      .from('code_memories')
      .upsert(blocks, { onConflict: 'project_id,file_name' })

    if (error) throw error
    return NextResponse.json({ success: true, count: blocks.length })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
