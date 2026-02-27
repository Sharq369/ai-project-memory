import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (secret && signature) {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');
    if (signature !== digest) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const repoName = payload.repository?.full_name;
    const commits = payload.commits || [];

    const { data: project } = await supabase.from('projects').select('id').eq('repo_full_name', repoName).single();
    if (!project) return NextResponse.json({ error: "Node not mapped" }, { status: 404 });

    const files = new Set<string>();
    commits.forEach((c: any) => [...c.added, ...c.modified].forEach(f => files.add(f)));

    await supabase.from('code_memories').update({ is_verified: true, deployed_at: new Date().toISOString() }).eq('project_id', project.id).in('file_name', Array.from(files));

    return NextResponse.json({ status: "Neural Sync Verified" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
