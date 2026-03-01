import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()

    // 1. Fetch the top-level source files from Bitbucket (defaults to max_depth=5 for simplicity)
    const treeRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${repo}/src/main/?max_depth=5`)
    
    if (!treeRes.ok) {
        // Fallback check for master branch
        const masterRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${repo}/src/master/?max_depth=5`)
        if (!masterRes.ok) throw new Error('Bitbucket repository not found or is private.')
    }
    
    // Bitbucket returns a paginated list of files/directories
    const treeData = await (treeRes.ok ? treeRes.json() : (await fetch(`https://api.bitbucket.org/2.0/repositories/${repo}/src/master/?max_depth=5`)).json())
    const files = treeData.values.filter((item: any) => item.type === 'commit_file')
    let syncedCount = 0

    // 2. Initialize Neural Link (Supabase)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 3. Process and Inject Files
    for (const file of files) {
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue;

      const fileRes = await fetch(file.links.self.href)
      if (!fileRes.ok) continue;
      
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
