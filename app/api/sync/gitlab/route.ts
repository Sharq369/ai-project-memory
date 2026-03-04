import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()
    const encodedRepo = encodeURIComponent(repo)

    let allFiles: any[] = [];
    let page = 1;
    let totalPages = 1;

    // Loop through all pages to grab every file
    while (page <= totalPages) {
        const treeRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/tree?recursive=true&per_page=100&page=${page}`);
        if (!treeRes.ok) throw new Error('GitLab repository not found or is private.');
        
        const tree = await treeRes.json();
        allFiles = [...allFiles, ...tree.filter((item: any) => item.type === 'blob')];
        
        const totalPagesHeader = treeRes.headers.get('x-total-pages');
        if (totalPagesHeader) {
            totalPages = parseInt(totalPagesHeader, 10);
        }
        page++;
    }

    let syncedCount = 0

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    for (const file of allFiles) {
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue;

      let fileRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=main`);
      
      if (!fileRes.ok) {
        fileRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=master`);
        if (!fileRes.ok) continue;
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
