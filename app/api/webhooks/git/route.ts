import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getLimits, PlanType } from '../../../../lib/plans';

// ── Supabase Admin Client (module-level singleton) ────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Developer override — always gets Platinum plan ───────────────────────────
const DEVELOPER_IDS = ['33157b98-fdd0-4e04-b14b-bee4352f80c7'];

// ── HMAC Signature Verification ──────────────────────────────────────────────
// Note: digest is built as 'sha256=' + hex ONCE, then compared directly.
// Avoids the double-prefix bug ('sha256=sha256=...') that causes all webhooks
// to return 401.
function verifyGitHubSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  try {
    return (
      digest.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
    );
  } catch {
    return false;
  }
}

// ── Structural Analysis Engine ────────────────────────────────────────────────
function calculateMaturity(filePaths: string[]): number {
  let score = 15;
  const paths = filePaths.join(' ').toLowerCase();

  if (paths.includes('package.json') || paths.includes('requirements.txt')) score += 10;
  if (paths.includes('tsconfig.json') || paths.includes('dockerfile'))       score += 10;
  if (paths.includes('.github/workflows') || paths.includes('.gitlab-ci.yml')) score += 15;
  if (paths.includes('readme.md'))                                            score += 10;
  if (paths.includes('/docs') || paths.includes('changelog'))                 score += 5;
  if (paths.includes('.test.') || paths.includes('.spec.') || paths.includes('/tests/')) score += 20;

  const volumeScore = Math.min(15, Math.floor(filePaths.length / 5));
  score += volumeScore;

  return Math.min(100, score);
}

// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const bodyText  = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 1. Security Gate ─────────────────────────────────────────────────────────
    if (!verifyGitHubSignature(bodyText, signature)) {
      console.error('[Webhook] ❌ Unauthorized handshake — signature mismatch');
      return NextResponse.json({ error: 'Unauthorized Handshake' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);

    const repoName      = payload.repository?.name;
    const fullName      = payload.repository?.full_name;   // e.g. "Sharq369/ai-project-memory"
    const defaultBranch = payload.repository?.default_branch || 'main';

    if (!repoName || !fullName) {
      return NextResponse.json({ message: 'Invalid payload, ignoring.' }, { status: 200 });
    }

    console.log(`[Webhook] ✅ Verified push from: ${fullName}`);

    // 2. Locate Target Node ───────────────────────────────────────────────────
    // Three-pass lookup — from most reliable to least:
    //
    // Pass 1: exact match on repo_full_name  (fastest, most reliable)
    // Pass 2: fuzzy match on repo_url        (catches projects with URL but no full_name set)
    // Pass 3: fuzzy match on project name    (original strategy — fallback for legacy projects)
    //
    // When found via Pass 2 or 3, we auto-save repo_full_name to the project
    // so the next push always hits Pass 1. Self-healing — no manual SQL needed.
    // ─────────────────────────────────────────────────────────────────────────
    let project: { id: string; user_id: string } | null = null;
    let autoSaveRepoName = false;

    // Pass 1
    const { data: pass1 } = await supabase
      .from('projects')
      .select('id, user_id, repo_full_name')
      .eq('repo_full_name', fullName)
      .maybeSingle();

    if (pass1) {
      project = pass1;
      console.log(`[Webhook] Pass 1 match — repo_full_name: ${fullName}`);
    }

    // Pass 2
    if (!project) {
      const { data: pass2 } = await supabase
        .from('projects')
        .select('id, user_id, repo_full_name')
        .ilike('repo_url', `%${fullName}%`)
        .maybeSingle();

      if (pass2) {
        project = pass2;
        autoSaveRepoName = true;
        console.log(`[Webhook] Pass 2 match — repo_url contains: ${fullName}`);
      }
    }

    // Pass 3
    if (!project) {
      const { data: pass3 } = await supabase
        .from('projects')
        .select('id, user_id, repo_full_name')
        .ilike('name', repoName)
        .maybeSingle();

      if (pass3) {
        project = pass3;
        autoSaveRepoName = true;
        console.log(`[Webhook] Pass 3 match — project name ilike: ${repoName}`);
      }
    }

    if (!project) {
      // If you still see this in Vercel logs, run this SQL in Supabase:
      //
      //   UPDATE projects
      //   SET repo_full_name = 'YourUsername/your-repo-name',
      //       provider = 'github'
      //   WHERE id = 'your-project-uuid';
      //
      console.warn(`[Webhook] ⚠️ No project found for repo: ${fullName}`);
      return NextResponse.json({ message: 'Node not found, ignoring.' }, { status: 200 });
    }

    // Auto-save repo_full_name for future fast-path lookups
    if (autoSaveRepoName) {
      await supabase
        .from('projects')
        .update({ repo_full_name: fullName, provider: 'github' })
        .eq('id', project.id);
      console.log(`[Webhook] Auto-saved repo_full_name="${fullName}" to project ${project.id}`);
    }

    const userId = project.user_id;

    // 3. Plan Gate ─────────────────────────────────────────────────────────────
    // Developer override → always Platinum.
    // Free tier → silently drop (return 200 so GitHub doesn't flag a failure).
    let plan: PlanType = 'free';

    if (DEVELOPER_IDS.includes(userId)) {
      plan = 'platinum';
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', userId)
        .single();
      plan = (profile?.plan_type as PlanType) || 'free';
    }

    if (plan === 'free') {
      console.log(`[Webhook] Free plan — auto-sync skipped for project ${project.id}`);
      return NextResponse.json(
        { message: 'Auto-sync requires Pro/Platinum. Ignored.' },
        { status: 200 }
      );
    }

    const limits     = getLimits(plan);
    const FILE_LIMIT = limits.filesPerSync === Infinity ? 9999 : limits.filesPerSync;

    // 4. Fetch File Tree ───────────────────────────────────────────────────────
    const authHeaders: Record<string, string> = {};
    if (limits.privateRepos && process.env.GITHUB_TOKEN) {
      authHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const treeRes = await fetch(
      `https://api.github.com/repos/${fullName}/git/trees/${defaultBranch}?recursive=1`,
      { headers: authHeaders }
    );

    if (!treeRes.ok) {
      console.error(`[Webhook] Failed to fetch tree for ${fullName}: ${treeRes.status}`);
      return NextResponse.json({ message: 'Failed to access repository tree.' }, { status: 200 });
    }

    const { tree } = await treeRes.json();
    const files = tree
      .filter((f: any) => f.type === 'blob')
      .filter((f: any) => !f.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i))
      .slice(0, FILE_LIMIT);

    // 5. Atomic Wipe ───────────────────────────────────────────────────────────
    await supabase.from('code_memories').delete().eq('project_id', project.id);

    // 6. Download & Inject Files ───────────────────────────────────────────────
    let syncedCount = 0;
    const syncedPaths: string[] = [];
    const syncedAt = new Date().toISOString();

    for (const file of files) {
      const fileRes = await fetch(
        `https://raw.githubusercontent.com/${fullName}/${defaultBranch}/${file.path}`,
        { headers: authHeaders }
      );
      if (!fileRes.ok) continue;

      const { error } = await supabase.from('code_memories').insert({
        project_id:  project.id,
        file_name:   file.path,
        content:     await fileRes.text(),
        is_verified: true,
        deployed_at: syncedAt,
      });

      if (!error) {
        syncedCount++;
        syncedPaths.push(file.path);
      }
    }

    // 7. Update Project State ──────────────────────────────────────────────────
    // Writes updated_at + last_sync so the dashboard card shows "Just now"
    // and the Supabase Realtime listener fires the toast notification.
    const maturityScore = calculateMaturity(syncedPaths);

    await supabase
      .from('projects')
      .update({
        maturity_score:    maturityScore,
        updated_at:        syncedAt,  // ← drives "Sync: Just now" on the card
        last_sync:         syncedAt,  // ← explicit sync timestamp
        deployment_status: 'synced',  // ← status badge on card
      })
      .eq('id', project.id);

    console.log(`[Webhook] ✅ Sync complete — ${syncedCount} files, maturity ${maturityScore}%`);

    return NextResponse.json({
      status:         'Neural Sync Complete via Webhook',
      node:           repoName,
      files_synced:   syncedCount,
      maturity_score: maturityScore,
      timestamp:      syncedAt,
    }, { status: 200 });

  } catch (error) {
    console.error('[Webhook] ❌ Internal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
