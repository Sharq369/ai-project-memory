import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()
    // Use SERVICE_ROLE_KEY to bypass RLS policies on the server
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const repoRes = await fetch(`https://api.github.com/repos/${repo}`)
    if (!repoRes.ok) throw new Error(`GitHub Error: ${repoRes.status}. Check if repo is public.`)
    const repoData = await repoRes.json()
    const branch = repoData.default_branch

    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`)
    if (!treeRes.ok) throw new Error(`Failed to fetch tree. Branch: ${branch}`)
    const treeData = await treeRes.json()
    const files = treeData.tree.filter((item: any) => item.type === 'blob')

    let syncedCount = 0
    for (const file of files) {
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue
      const fileRes = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file.path}`)
      if (!fileRes.ok) continue
      const content = await fileRes.text()

      const { error: dbError } = await supabase.from('code_memories').insert({
        project_id: projectId,
        file_name: file.path,
        content: content
      })
      if (dbError) throw new Error(`DB Insert Fail: ${dbError.message}`)
      syncedCount++
    }
    return NextResponse.json({ success: true, count: syncedCount })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
