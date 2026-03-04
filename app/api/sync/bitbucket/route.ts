import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()

    let allFiles: any[] = [];
    let nextUrl = `https://api.bitbucket.org/2.0/repositories/${repo}/src/main/?max_depth=10`; // Increased depth

    // Fallback to master if main fails
    const initialCheck = await fetch(nextUrl);
    if (!initialCheck.ok) {
        nextUrl = `https://api.bitbucket.org/2.0/repositories/${repo}/src/master/?max_depth=10`;
    }

    // Loop to handle paginated responses
    while (nextUrl) {
        const treeRes = await fetch(nextUrl);
        if (!treeRes.ok) throw new Error('Bitbucket repository not found or is private.');
        
        const treeData = await treeRes.json();
        const files = treeData.values.filter((item: any) => item.type === 'commit_file');
        allFiles = [...allFiles, ...files];
        
        nextUrl = treeData.next || null;
    }

    let syncedCount = 0

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    for (const file of allFiles) {
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
