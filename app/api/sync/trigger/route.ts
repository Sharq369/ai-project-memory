import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // Extract owner and repo from the URL
    const pathParts = url.replace('https://github.com/', '').split('/')
    const owner = pathParts[0]
    const repo = pathParts[1]?.replace('.git', '')

    if (!owner || !repo) {
      return NextResponse.json({ error: "Invalid repository URL format." }, { status: 400 })
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // Fetch from GitHub using the token from your Vercel environment
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error("GitHub API Error Status:", response.status)
      return NextResponse.json({ error: "GitHub access failed. Repository might be private or token is invalid." }, { status: 401 })
    }

    const files = await response.json()
    
    const blocks = []
    for (const file of files) {
      // Only sync code files
      if (file.type === 'file' && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js'))) {
        const contentRes = await fetch(file.download_url)
        const content = await contentRes.text()
        
        const { data: userData } = await supabase.auth.getUser()
        
        blocks.push({
          project_id: projectId,
          file_name: file.name,
          content: content,
          user_id: userData.user?.id
        })
      }
    }

    if (blocks.length > 0) {
      const { error: insertError } = await supabase.from('code_memories').insert(blocks)
      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true, count: blocks.length })

  } catch (error: any) {
    console.error("Sync Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
