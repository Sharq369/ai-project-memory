import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Identify the default branch
    let branch = 'main'
    let repoRes = await fetch(`https://api.github.com/repos/${repo}`)
    
    if (!repoRes.ok) {
      throw new Error(`GitHub API Error: ${repoRes.status}. Make sure the repo name is 'owner/repo' and it is public.`)
    }
    
    const repoData = await repoRes.json()
    branch = repoData.default_branch // Automatically uses main, master, or whatever is set

    // 2. Fetch the recursive tree
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`)
    
    if (!treeRes.ok) {
       throw new Error(`Failed to fetch file tree for branch: ${branch}. Error: ${treeRes.status}`)
    }

    const treeData = await treeRes.json()
    // GitHub 'blob' type represents files
    const files = treeData.tree.filter((item: any) => item.type === 'blob')

    if (files.length === 0) {
      throw new Error("GitHub found the repository, but it appears to be empty.")
    }

    let syncedCount = 0

    // 3. Process and Insert
    for (const file of files) {
      // Ignore binaries and images
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue

      const fileRes = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file.path}`)
      if (!fileRes.ok) continue
      
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
