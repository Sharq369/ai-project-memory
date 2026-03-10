import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// FIX: SERVICE_ROLE_KEY — webhooks have no user session
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyGitHubSignature(payload: string, signature: string | null) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (!verifyGitHubSignature(bodyText, signature)) {
      return NextResponse.json({ error: 'Unauthorized Handshake' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const repoName = payload.repository?.name;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', repoName)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ message: 'Node not found, ignoring.' }, { status: 200 });
    }

    await supabase
      .from('code_memories')
      .update({ 
        is_verified: true, 
        deployed_at: new Date().toISOString() 
      })
      .eq('project_id', project.id);

    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', project.id);

    return NextResponse.json({ 
      status: 'Neural Sync Complete', 
      node: repoName,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
