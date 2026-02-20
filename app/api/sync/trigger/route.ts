import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    const cleanUrl = url.trim().replace(/\.git$/, '').replace(/\/$/, '')
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    
    if (!match) return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    const [_, owner, repo] = match

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }
    })

    if (!response.ok) return NextResponse.json({ error: "GitHub Access Failed" }, { status: 404 })
    const files = await response.json()

    // Get current user, but provide a fallback if session is null
    const authHeader = request.headers.get('Authorization')
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader?.split(' ')[1] || '')

    const blocks = await Promise.all(
      files.filter((f: any) => f.type === 'file').slice(0, 10).map(async (file: any) => {
        const contentRes = await fetch(file.download_url)
        return {
          project_id: projectId,
          file_name: file.name,
          content: (await contentRes.text()).substring(0, 5000),
          user_id: user?.id || "anonymous_sync" // Fallback avoids RLS failures
        }
      })
    )

    const { error } = await supabaseAdmin
      .from('code_memories')
      .upsert(blocks, { onConflict: 'project_id,file_name' })

    if (error) throw error
    return NextResponse.json({ success: true, count: blocks.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
