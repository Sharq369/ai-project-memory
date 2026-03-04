import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 1. Get Repo Details to find the default branch
    const repoRes = await fetch(`https://api.github.com/repos/${repo}`)
    if (!repoRes.ok) throw new Error(`GitHub Error: ${repoRes.status}. Check if "${repo}" is public and spelled correctly.`)
    const repoData = await repoRes.json()
    const branch = repoData.default_branch

    // 2. Fetch the full recursive tree
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`)
    if (!treeRes.ok) throw new Error(`Tree Fetch Failed: ${treeRes.status}. The branch "${branch}" might be empty.`)
    const treeData = await treeRes.json()
    
    // Filter for files (blobs) only
    const files = treeData.tree.filter((item: any) => item.type === 'blob')
    if (files.length === 0) throw new Error("No files found in this repository.")

    let syncedCount = 0
    for (const file of files) {
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue

      const fileRes = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file.path}`)
      if (!fileRes.ok) continue
      
      const content = await fileRes.text()

      // 3. Database Injection
      const { error: dbError } = await supabase.from('code_memories').insert({
        project_id: projectId,
        file_name: file.path,
        content: content
      })

      if (dbError) throw new Error(`Database Insert Error: ${dbError.message}`)
      syncedCount++
    }

    return NextResponse.json({ success: true, count: syncedCount })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
