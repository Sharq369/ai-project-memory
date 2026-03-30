import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getLimits, PlanType } from '../../../../lib/plans';

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEVELOPER_IDS = ['33157b98-fdd0-4e04-b14b-bee4352f80c7'];

// Standard GitHub Signature Verification
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

// Structural Analysis Engine
function calculateMaturity(filePaths: string[]): number {
  let score = 15;
  const paths = filePaths.join(' ').toLowerCase();

  if (paths.includes('package.json') || paths.includes('requirements.txt')) score += 10;
  if (paths.includes('tsconfig.json') || paths.includes('dockerfile')) score += 10;
  if (paths.includes('.github/workflows') || paths.includes('.gitlab-ci.yml')) score += 15;
  if (paths.includes('readme.md')) score += 10;
  if (paths.includes('/docs') || paths.includes('changelog')) score += 5;
  if (paths.includes('.test.') || paths.includes('.spec.') || paths.includes('/tests/')) score += 20;
  
  const volumeScore = Math.min(15, Math.floor(filePaths.length / 5));
  score += volumeScore;

  return Math.min(100, score);
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 1. Security Check
    if (!verifyGitHubSignature(bodyText, signature)) {
      return NextResponse.json({ error: 'Unauthorized Handshake' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    
    // Only process push events (ignore stars, forks, etc. if webhook isn't filtered)
    const repoName = payload.repository?.name;
    const fullName = payload.repository?.full_name;
    const defaultBranch = payload.repository?.default_branch || 'main';

    if (!repoName || !fullName) {
      return NextResponse.json({ message: 'Invalid payload, ignoring.' }, { status: 200 });
    }

    // 2. Locate the Target Node & Owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .ilike('name', repoName)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ message: 'Node not found, ignoring.' }, { status: 200 });
    }

    const userId = project.user_id;

    // 3. The Gatekeeper: Subscription & Limit Checks
    let plan: PlanType = 'free';
    if (DEVELOPER_IDS.includes(userId)) {
      plan = 'platinum'; // Developer Override
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', userId)
        .single();
      plan = (profile?.plan_type as PlanType) || 'free';
    }

    // Free tier silently drops the sync process. We return 200 so GitHub 
    // doesn't record a delivery failure and disable the webhook.
    if (plan === 'free') {
      return NextResponse.json({ message: 'Auto-sync requires Pro/Platinum. Ignored.' }, { status: 200 });
    }

    const limits = getLimits(plan);
    const FILE_LIMIT = limits.filesPerSync === Infinity ? 9999 : limits.filesPerSync;

    // 4. Authenticate & Fetch File Tree
    const authHeaders: Record<string, string> = {};
    if (limits.privateRepos && process.env.GITHUB_TOKEN) {
      authHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const treeRes = await fetch(`https://api.github.com/repos/${fullName}/git/trees/${defaultBranch}?recursive=1`, { headers: authHeaders });
    
    if (!treeRes.ok) {
      return NextResponse.json({ message: 'Failed to access repository tree.' }, { status: 200 });
    }

    const { tree } = await treeRes.json();
    const files = tree
      .filter((f: any) => f.type === 'blob')
      .filter((f: any) => !f.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i))
      .slice(0, FILE_LIMIT);

    // 5. Atomic Wipe: Prevent unique constraint violations
    await supabase.from('code_memories').delete().eq('project_id', project.id);

    let syncedCount = 0;
    const syncedPaths: string[] = [];

    // 6. Download and Inject Files
    for (const file of files) {
      const fileRes = await fetch(`https://raw.githubusercontent.com/${fullName}/${defaultBranch}/${file.path}`, { headers: authHeaders });
      if (!fileRes.ok) continue;
      
      const { error } = await supabase.from('code_memories').insert({
        project_id: project.id,
        file_name: file.path,
        content: await fileRes.text(),
        is_verified: true,
        deployed_at: new Date().toISOString()
      });

      if (!error) {
        syncedCount++;
        syncedPaths.push(file.path);
      }
    }

    // 7. Update Project State
    const maturityScore = calculateMaturity(syncedPaths);
    
    await supabase
      .from('projects')
      .update({ 
        updated_at: new Date().toISOString(),
        maturity_score: maturityScore
      })
      .eq('id', project.id);

    return NextResponse.json({ 
      status: 'Neural Sync Complete via Webhook', 
      node: repoName,
      files_synced: syncedCount,
      maturity_score: maturityScore,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
