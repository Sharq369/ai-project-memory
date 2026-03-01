import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()
    
    // GitLab requires the repo path (owner/repo) to be URL encoded
    const encodedRepo = encodeURIComponent(repo)

    // 1. Fetch the project's file tree
    const treeRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/tree?recursive=true&per_page=100`)
    if (!treeRes.ok) throw new Error('GitLab repository not found or is private.')
    
    const tree = await treeRes.json()
    const files = tree.filter((item: any) => item.type === 'blob')
    let syncedCount = 0

    // 2. Initialize Neural Link (Supabase)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 3. Process and Inject Files
    for (const file of files) {
      // Ignore compiled binaries and images to keep the neural node fast
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue;

      const fileRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=main`)
      
      // Fallback to 'master' if 'main' fails
      if (!fileRes.ok) {
        const masterRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=master`)
        if (!masterRes.ok) continue;
        const content = await masterRes.text()
        
        const { error } = await supabase.from('code_memories').insert({
          project_id: projectId,
          file_name: file.path,
          content: content
        })
        if (!error) syncedCount++
        continue;
      }

      const content = await fileRes.text()
      const { error } = await supabase.from('code_memories').insert({
        project_id: projectId,
        file_name: file.path,
        content: content
      })
      
      if (!error) syncedCount++
    }

    return NextResponse.json({ success: true, count: syncedCount })
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
