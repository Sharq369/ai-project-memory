import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // 1. Signature Verification
  if (secret && signature) {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');
    if (signature !== digest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(rawBody);
    const repoName = payload.repository?.full_name;
    const commits = payload.commits || [];

    // 2. Map Repo to Project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('repo_full_name', repoName)
      .single();

    if (!project) return NextResponse.json({ error: "Project not mapped" }, { status: 404 });

    // 3. Extract Files
    const changedFiles = new Set<string>();
    commits.forEach((c: any) => {
      [...c.added, ...c.modified].forEach(f => changedFiles.add(f));
    });

    // 4. Update Memory & Timestamp
    const { error } = await supabase
      .from('code_memories')
      .update({ 
        is_verified: true, 
        sync_status: 'synced',
        deployed_at: new Date().toISOString() // This powers your "Last Synced" UI
      })
      .eq('project_id', project.id)
      .in('file_name', Array.from(changedFiles));

    if (error) throw error;

    return NextResponse.json({ status: "Neural Sync Verified" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
