import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json()
    
    // 1. CLEAN THE PATH (Fixes the .git error from your screenshot)
    const cleanUrl = url.trim().replace(/\/$/, '').replace(/\.git$/, '')
    const parts = cleanUrl.split('/')
    const repo = parts.pop()
    const owner = parts.pop()

    // 2. FETCH FROM GITHUB
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }
    });

    if (!response.ok) return NextResponse.json({ error: "GitHub Access Failed" }, { status: 404 })
    const files = await response.json()

    // 3. PREPARE DATA
    const blocks = await Promise.all(files.slice(0, 10).map(async (file: any) => {
      const res = await fetch(file.download_url);
      return {
        project_id: projectId,
        file_name: file.name,
        content: await res.text(),
        user_id: (await supabaseAdmin.auth.getUser(request.headers.get('Authorization')?.split(' ')[1] || '')).data.user?.id
      };
    }));

    // 4. UPSERT (Fixes the Duplicate Key error from your screenshot)
    const { error } = await supabaseAdmin
      .from('code_memories')
      .upsert(blocks, { onConflict: 'project_id,file_name' })

    if (error) throw error
    return NextResponse.json({ success: true, count: blocks.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
