import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (Needs Service Role for background webhook tasks ideally, 
// but ANON key works if your RLS policies allow it)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to verify GitHub's cryptographic signature
function verifyGitHubSignature(payload: string, signature: string | null) {
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!secret) {
    console.error("Missing WEBHOOK_SECRET in Vercel environment variables.");
    return false;
  }
  if (!signature) {
    console.error("Missing x-hub-signature-256 header from GitHub.");
    return false;
  }

  // GitHub uses HMAC hex digest with SHA-256
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  // Use crypto.timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch (err) {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // 1. Get the raw text body for signature verification
    const bodyText = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 2. Verify the handshake
    const isValid = verifyGitHubSignature(bodyText, signature);
    if (!isValid) {
      console.error("Neural Sync Failed: Invalid Signature or Secret Mismatch.");
      return NextResponse.json({ error: 'Unauthorized Handshake' }, { status: 401 });
    }

    // 3. Parse the payload now that it's verified
    const payload = JSON.parse(bodyText);
    const repoName = payload.repository?.name;

    console.log(`Neural Sync Authorized for Node: ${repoName}`);

    // 4. Find the matching project in your Vault
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', repoName) // case-insensitive match
      .single();

    if (projectError || !project) {
      console.log(`No active node found in Vault for repo: ${repoName}`);
      return NextResponse.json({ message: 'Node not found in Vault, ignoring.' }, { status: 200 });
    }

    // 5. Update the grounded state of your code memories
    await supabase
      .from('code_memories')
      .update({ 
        is_verified: true, 
        deployed_at: new Date().toISOString() 
      })
      .eq('project_id', project.id);

    // Update the project's last sync time
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
