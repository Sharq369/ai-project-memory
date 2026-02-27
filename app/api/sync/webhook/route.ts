import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Required for bypass RLS
);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const repoName = payload.repository?.full_name; // e.g., "Sharq369/ai-project-memory"
    const commits = payload.commits || [];

    if (!repoName || commits.length === 0) {
      return NextResponse.json({ message: "No relevant data" }, { status: 200 });
    }

    // 1. Find the project linked to this repository
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id')
      .eq('repo_full_name', repoName)
      .single();

    if (pError || !project) {
      console.error("Project not found for repo:", repoName);
      return NextResponse.json({ error: "Node not mapped to repository" }, { status: 404 });
    }

    // 2. Extract all modified/added file names from the push
    const changedFiles = new Set<string>();
    commits.forEach((commit: any) => {
      [...commit.added, ...commit.modified].forEach(file => changedFiles.add(file));
    });

    const fileList = Array.from(changedFiles);

    // 3. Mark these files as "Verified" (Grounded) in the database
    // We assume the file_name in Supabase matches the repo path (e.g., 'package.json')
    const { error: uError } = await supabase
      .from('code_memories')
      .update({ 
        is_verified: true, 
        sync_status: 'synced',
        last_synced_at: new Date().toISOString() 
      })
      .eq('project_id', project.id)
      .in('file_name', fileList);

    if (uError) throw uError;

    return NextResponse.json({ 
      status: "Neural sync complete", 
      verified_files: fileList 
    });

  } catch (err: any) {
    console.error("Webhook Neural Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
