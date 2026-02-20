import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // 1. Clean Path (Solves .git vs no .git issue)
    const cleanUrl = url.trim().replace(/\/$/, '').replace(/\.git$/, '')
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    
    const [_, owner, repo] = match

    // 2. Fetch from GitHub
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) return NextResponse.json({ error: "GitHub access failed" }, { status: 404 })
    const files = await response.json()

    // 3. Process first 10 files
    const blocks = await Promise.all(
      files.filter((f: any) => f.type === 'file').slice(0, 10).map(async (file: any) => {
        const contentRes = await fetch(file.download_url)
        const content = await contentRes.text()
        return {
          project_id: projectId,
          file_name: file.name,
          content: content.substring(0, 5000),
          user_id: "system-sync" // Temporary bypass to ensure it works
        }
      })
    )

    // 4. Upsert (Solves Duplicate Key error)
    const { error } = await supabaseAdmin
      .from('code_memories')
      .upsert(blocks, { onConflict: 'project_id,file_name' })

    if (error) throw error
    return NextResponse.json({ success: true, count: blocks.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
