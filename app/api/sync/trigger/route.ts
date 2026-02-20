import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'];

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // 1. Get the real user ID from the Auth header
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token || '')

    // 2. Claude's Bulletproof URL Parser
    const cleanUrl = url.trim().replace(/\.git$/i, '').replace(/\/$/, '')
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    const [_, owner, repo] = match

    // 3. Fetch from GitHub
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }
    })
    if (!response.ok) return NextResponse.json({ error: "GitHub access denied" }, { status: 404 })
    const files = await response.json()

    // 4. Map the blocks - ONLY using a real UUID if it exists
    const blocks = await Promise.all(
      files.filter((f: any) => f.type === 'file' && ALLOWED_EXTENSIONS.some(ext => f.name.endsWith(ext)))
      .slice(0, 15)
      .map(async (file: any) => {
        const res = await fetch(file.download_url)
        return {
          project_id: projectId,
          file_name: file.name,
          content: (await res.text()).substring(0, 10000),
          // Only add user_id if we have a valid one to avoid UUID syntax errors
          ...(user?.id && { user_id: user.id }) 
        }
      })
    )

    // 5. UPSERT with conflict handling
    const { error } = await supabaseAdmin
      .from('code_memories')
      .upsert(blocks, { onConflict: 'project_id,file_name' })

    if (error) throw error
    return NextResponse.json({ success: true, count: blocks.length })

  } catch (err: any) {
    // This will now catch any remaining database syntax issues
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
