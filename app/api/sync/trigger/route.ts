import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This client stays on the server and uses the Master Key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // Clean URL and extract owner/repo
    const cleanUrl = url.replace(/\/$/, '')
    const pathParts = cleanUrl.replace('https://github.com/', '').split('/')
    const owner = pathParts[0]
    const repo = pathParts[1]?.replace('.git', '')

    if (!owner || !repo) {
      return NextResponse.json({ error: "Invalid repository URL format." }, { status: 400 })
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // 1. Fetch from GitHub
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "GitHub access failed. Check token or visibility." }, { status: 401 })
    }

    const files = await response.json()
    const blocks = []

    // 2. Map and fetch file contents
    for (const file of files) {
      if (file.type === 'file' && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js'))) {
        const contentRes = await fetch(file.download_url)
        const content = await contentRes.text()
        
        // We use the admin client to find the user session if needed, 
        // or just tag the projectId provided by the frontend.
        blocks.push({
          project_id: projectId,
          file_name: file.name,
          content: content,
          // Since it's a server sync, we ensure project_id is the primary link
        })
      }
    }

    // 3. Insert using Admin client to bypass RLS policy "violation"
    if (blocks.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('code_memories')
        .insert(blocks)
      
      if (insertError) {
        console.error("Supabase Admin Insert Error:", insertError.message)
        throw insertError
      }
    }

    return NextResponse.json({ success: true, count: blocks.length })

  } catch (error: any) {
    console.error("Critical Sync Failure:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
