import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()

    // 1. Get the default branch (main or master)
    const repoRes = await fetch(`https://api.github.com/repos/${repo}`);
    if (!repoRes.ok) throw new Error('GitHub repository not found or is private.');
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch;

    // 2. Fetch the latest commit SHA
    const branchRes = await fetch(`https://api.github.com/repos/${repo}/branches/${defaultBranch}`);
    if (!branchRes.ok) throw new Error('Could not fetch branch details.');
    const branchData = await branchRes.json();
    const treeSha = branchData.commit.commit.tree.sha;

    // 3. Use recursive=1 to get EVERYTHING, deeply nested
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${treeSha}?recursive=1`);
    const treeData = await treeRes.json();
    
    const files = treeData.tree.filter((item: any) => item.type === 'blob');
    let syncedCount = 0;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    for (const file of files) {
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i)) continue;

      const fileRes = await fetch(`https://raw.githubusercontent.com/${repo}/${defaultBranch}/${file.path}`);
      if (!fileRes.ok) continue;
      
      const content = await fileRes.text();

      const { error } = await supabase.from('code_memories').insert({
        project_id: projectId,
        file_name: file.path,
        content: content
      });

      if (!error) syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount })
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
