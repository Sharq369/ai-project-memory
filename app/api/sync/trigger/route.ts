import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client to bypass RLS during the server-side sync process
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// The "Vibe List" - prioritizing important files for Vibe Coding
const VIBE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css'];
const VIBE_FILES = ['tailwind.config.js', 'next.config.js', 'package.json'];
const MAX_BLOCKS = 15;

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // Identify the User
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token || '')

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse GitHub URL
    const cleanUrl = url.replace(/\/$/, '')
    const pathParts = cleanUrl.replace('https://github.com/', '').split('/')
    const owner = pathParts[0]
    const repo = pathParts[1]?.replace('.git', '')

    // Get file list from GitHub
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "GitHub repository not found." }, { status: 404 })
    }

    const allFiles = await response.json()

    // Filter for "Vibe" files and limit count to stay under 10s timeout
    const filteredFiles = allFiles
      .filter((f: any) => 
        (f.type === 'file' && VIBE_EXTENSIONS.some(ext => f.name.endsWith(ext))) ||
        VIBE_FILES.includes(f.name)
      )
      .slice(0, MAX_BLOCKS);

    // Parallel Fetching
    const blocks = await Promise.all(
      filteredFiles.map(async (file: any) => {
        const contentRes = await fetch(file.download_url);
        const content = await contentRes.text();
        return {
          project_id: projectId,
          file_name: file.name,
          content: content.substring(0, 10000),
          user_id: user.id
        };
      })
    );

    // THE UPSERT FIX: This solves the "duplicate key" error
    if (blocks.length > 0) {
      const { error } = await supabaseAdmin
        .from('code_memories')
        .upsert(blocks, { 
          onConflict: 'project_id,file_name' // Targets your unique constraint
        })
      
      if (error) throw error
    }

    return NextResponse.json({ 
      success: true, 
      count: blocks.length 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
