import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // --- THE FIX: Extract User ID from the Authorization Header ---
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: No user session found." }, { status: 401 })
    }

    const cleanUrl = url.replace(/\/$/, '')
    const pathParts = cleanUrl.replace('https://github.com/', '').split('/')
    const owner = pathParts[0]
    const repo = pathParts[1]?.replace('.git', '')

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return NextResponse.json({ error: "GitHub access failed." }, { status: 401 })

    const files = await response.json()
    const blocks = []

    for (const file of files) {
      if (file.type === 'file' && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js'))) {
        const contentRes = await fetch(file.download_url)
        const content = await contentRes.text()
        
        blocks.push({
          project_id: projectId,
          file_name: file.name,
          content: content,
          user_id: user.id // Now properly tagged to YOU
        })
      }
    }

    if (blocks.length > 0) {
      const { error } = await supabaseAdmin.from('code_memories').insert(blocks)
      if (error) throw error
    }

    return NextResponse.json({ success: true, count: blocks.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
