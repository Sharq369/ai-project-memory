import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'];
const MAX_FILES = 15;

export async function POST(request: NextRequest) {
  try {
    // 1. Match your frontend payload: { url, projectId }
    const { url, projectId } = await request.json()
    
    // 2. Claude's Bulletproof URL Parser
    let cleanUrl = url.trim().replace(/\.git$/i, '').replace(/\/$/, '')
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    
    if (!match) return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    const [_, owner, repo] = match

    // 3. Recursive Fetching Logic (Simplified for stability)
    const githubToken = process.env.GITHUB_TOKEN
    const fetchUrl = `https://api.github.com/repos/${owner}/${repo}/contents`
    
    const response = await fetch(fetchUrl, {
      headers: { 'Authorization': `Bearer ${githubToken}` }
    })

    if (!response.ok) return NextResponse.json({ error: "GitHub Access Denied" }, { status: 404 })
    
    const allItems = await response.json()
    const filesToSync = allItems
      .filter((f: any) => f.type === 'file' && ALLOWED_EXTENSIONS.some(ext => f.name.endsWith(ext)))
      .slice(0, MAX_FILES)

    // 4. Content Retrieval & Upsert
    const blocks = await Promise.all(
      filesToSync.map(async (file: any) => {
        const contentRes = await fetch(file.download_url)
        const text = await contentRes.text()
        return {
          project_id: projectId,
          file_name: file.name,
          content: text.substring(0, 8000), // Protect database from massive files
          user_id: "system-sync" 
        }
      })
    )

    // THE UPSERT (Fixes your Duplicate Key Error)
    const { error } = await supabaseAdmin
      .from('code_memories')
      .upsert(blocks, { onConflict: 'project_id,file_name' })

    if (error) throw error
    
    return NextResponse.json({ success: true, count: blocks.length })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
