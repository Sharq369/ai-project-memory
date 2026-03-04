import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()
    const encodedRepo = encodeURIComponent(repo)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const treeRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/tree?recursive=true&per_page=100`)
    if (!treeRes.ok) throw new Error('GitLab project not found or private.')
    const tree = await treeRes.json()
    const files = tree.filter((item: any) => item.type === 'blob')

    let syncedCount = 0
    for (const file of files) {
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue
      let fileRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=main`)
      if (!fileRes.ok) {
        fileRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=master`)
      }
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
