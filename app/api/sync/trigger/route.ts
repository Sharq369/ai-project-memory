import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VIBE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css'];
const VIBE_FILES = ['tailwind.config.js', 'next.config.js', 'package.json'];
const MAX_BLOCKS = 15;

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token || '')

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // --- SMART PATH CLEANING ---
    // This fixes the issue where URL with .git fails while URL without it works.
    const cleanUrl = url.trim().replace(/\/$/, '').replace(/\.git$/, '')
    
    const parts = cleanUrl.split('/')
    const repo = parts.pop()
    const owner = parts.pop()

    if (!owner || !repo) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }

    // Always uses the cleaned version for the GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "GitHub access failed. Check URL or privacy settings." }, { status: 404 })
    }
    
    const allFiles = await response.json()

    const filteredFiles = allFiles
      .filter((f: any) => 
        (f.type === 'file' && VIBE_EXTENSIONS.some(ext => f.name.endsWith(ext))) ||
        VIBE_FILES.includes(f.name)
      )
      .slice(0, MAX_BLOCKS);

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

    if (blocks.length > 0) {
      // Logic for upserting data to handle the duplicate key constraint
      const { error } = await supabaseAdmin
        .from('code_memories')
        .upsert(blocks, { onConflict: 'project_id,file_name' })
      
      if (error) throw error
    }

    return NextResponse.json({ success: true, count: blocks.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
