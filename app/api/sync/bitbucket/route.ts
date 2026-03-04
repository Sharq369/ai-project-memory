import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let nextUrl = `https://api.bitbucket.org/2.0/repositories/${repo}/src/main/?max_depth=10`
    const check = await fetch(nextUrl)
    if (!check.ok) nextUrl = `https://api.bitbucket.org/2.0/repositories/${repo}/src/master/?max_depth=10`

    let allFiles: any[] = []
    while (nextUrl) {
      const res = await fetch(nextUrl)
      if (!res.ok) break
      const data = await res.json()
      allFiles = [...allFiles, ...data.values.filter((i: any) => i.type === 'commit_file')]
      nextUrl = data.next || null
    }

    let syncedCount = 0
    for (const file of allFiles) {
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue
      const fileRes = await fetch(file.links.self.href)
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
