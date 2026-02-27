import { crypto } from 'next/dist/compiled/@edge-runtime/primitives';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Function to verify the GitHub Secret
async function verifySignature(payload: string, signature: string) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex');
  const verifyBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  
  return Buffer.compare(signatureBuffer, Buffer.from(verifyBuffer)) === 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || '';

    // 1. Verify Secret
    const isValid = await verifySignature(body, signature);
    if (!isValid) {
      console.error("Neural Handshake Failed: Invalid Secret");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const repoName = payload.repository?.name;
    
    // 2. Locate the project in your Vault
    const { data: project } = await supabase
      .from('projects')
      .update({ last_sync: new Date().toISOString() })
      .filter('name', 'ilike', repoName)
      .select()
      .single();

    if (!project) {
      return NextResponse.json({ message: 'Node not found in Vault' }, { status: 200 });
    }

    // 3. Update the files (Code Memory)
    // Here we simulate updating the 'grounded' state
    await supabase
      .from('code_memories')
      .update({ is_verified: true, deployed_at: new Date().toISOString() })
      .eq('project_id', project.id);

    return NextResponse.json({ status: 'Neural Sync Complete', repo: repoName });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
