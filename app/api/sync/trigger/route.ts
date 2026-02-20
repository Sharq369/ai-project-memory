import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client to bypass RLS during the server-side sync process
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // 1. Identify the User from the request token
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token || '')

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized: Please log in again." }, { status: 401 })
    }

    // 2. Parse GitHub URL
    const cleanUrl = url.replace(/\/$/, '')
    const pathParts = cleanUrl.replace('https://github.com/', '').split('/')
    const owner = pathParts[0]
    const repo = pathParts[1]?.replace('.git', '')

    if (!owner || !repo) {
      return NextResponse.json({ error: "Invalid repository URL." }, { status: 400 })
    }

    // 3. Get file list from GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "GitHub repository not found or private." }, { status: 404 })
    }

    const files = await response.json()

    // 4. Optimized Parallel Fetching (Beats the 10s Vercel Timeout)
    const blocks = await Promise.all(
      files
        .filter((file: any) => 
          file.type === 'file' && 
          (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js'))
        )
        .map(async (file: any) => {
          const contentRes = await fetch(file.download_url);
          const content = await contentRes.text();
          return {
            project_id: projectId,
            file_name: file.name,
            content: content,
            user_id: user.id // Automatically tags the data to the logged-in user
          };
        })
    );

    // 5. Bulk Insert to Supabase
    if (blocks.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('code_memories')
        .insert(blocks)
      
      if (insertError) throw insertError
    }

    return NextResponse.json({ 
      success: true, 
      count: blocks.length,
      message: `Successfully synced ${blocks.length} files.` 
    })

  } catch (error: any) {
    console.error("Sync Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
