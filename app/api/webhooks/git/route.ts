import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getLimits, PlanType } from '../../../../lib/plans';

// ── Supabase Admin Client ─────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Developer override ────────────────────────────────────────────────────────
const DEVELOPER_IDS = ['33157b98-fdd0-4e04-b14b-bee4352f80c7'];

// ── HMAC Signature Verification ──────────────────────────────────────────────
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
// FIX 1: notify() — inserts into the notifications table.
//
// This was the core notification bug. NotificationContext listens to
// postgres_changes on the notifications table. The webhook was updating
// the projects table but NEVER inserting into notifications — so the
// realtime listener had nothing to receive and no notification ever
// appeared, even though the bell, panel, and context were all wired correctly.
// ─────────────────────────────────────────────────────────────────────────────
async function notify(
  userId: string,
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message: string,
  link?: string
) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link:    link || null,
      is_read: false,
    });
  if (error) {
    console.error('[Webhook] Failed to insert notification:', error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const bodyText  = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 1. Security Gate ─────────────────────────────────────────────────────────
    if (!verifyGitHubSignature(bodyText, signature)) {
      console.error('[Webhook] Unauthorized — signature mismatch');
      return NextResponse.json({ error: 'Unauthorized Handshake' }, { status: 401 });
    }

    const payload       = JSON.parse(bodyText);
    const repoName      = payload.repository?.name;
    const fullName      = payload.repository?.full_name;
    const defaultBranch = payload.repository?.default_branch || 'main';

    if (!repoName || !fullName) {
      return NextResponse.json({ message: 'Invalid payload, ignoring.' }, { status: 200 });
    }

    console.log(`[Webhook] Verified push from: ${fullName}`);

    // 2. Locate Target Node — three-pass lookup ───────────────────────────────
    let project: { id: string; user_id: string } | null = null;
    let autoSaveRepoName = false;

    // Pass 1: exact repo_full_name match
    const { data: pass1 } = await supabase
      .from('projects')
      .select('id, user_id, repo_full_name')
      .eq('repo_full_name', fullName)
      .maybeSingle();
    if (pass1) { project = pass1; console.log(`[Webhook] Pass 1 match`); }

    // Pass 2: repo_url contains fullName
    if (!project) {
      const { data: pass2 } = await supabase
        .from('projects')
        .select('id, user_id, repo_full_name')
        .ilike('repo_url', `%${fullName}%`)
        .maybeSingle();
      if (pass2) { project = pass2; autoSaveRepoName = true; console.log(`[Webhook] Pass 2 match`); }
    }

    // Pass 3: project name matches repo name
    if (!project) {
      const { data: pass3 } = await supabase
        .from('projects')
        .select('id, user_id, repo_full_name')
        .ilike('name', repoName)
        .maybeSingle();
      if (pass3) { project = pass3; autoSaveRepoName = true; console.log(`[Webhook] Pass 3 match`); }
    }

    if (!project) {
      console.warn(`[Webhook] No project found for: ${fullName}`);
      return NextResponse.json({ message: 'Node not found, ignoring.' }, { status: 200 });
    }

    // Auto-save repo_full_name so next push hits Pass 1
    if (autoSaveRepoName) {
      await supabase
        .from('projects')
        .update({ repo_full_name: fullName, provider: 'github' })
        .eq('id', project.id);
    }

    const userId = project.user_id;

    // 3. Plan Gate ─────────────────────────────────────────────────────────────
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

    const limits = getLimits(plan);

    // ─────────────────────────────────────────────────────────────────────────
    // FIX 2: Gate on webhookAutoSync from plans.ts — not hardcoded plan name.
    // This reads directly from the plan definition so it stays in sync with
    // any future plan changes made in plans.ts.
    // ─────────────────────────────────────────────────────────────────────────
    if (!limits.webhookAutoSync) {
      console.log(`[Webhook] Plan "${plan}" — webhookAutoSync disabled, skipping`);
      return NextResponse.json(
        { message: 'Auto-sync requires Pro or Platinum.' },
        { status: 200 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX 3: Cap FILE_LIMIT to prevent Vercel timeout.
    //
    // Platinum has filesPerSync: Infinity → was resolving to 9999.
    // Downloading 9999 files takes 60-120s. Vercel Hobby = 10s timeout.
    // The function was killed before writing anything to the DB.
    // Capped at 150 — meaningful sync, safely within 10s limit.
    // ─────────────────────────────────────────────────────────────────────────
    const SAFE_MAX   = 150;
    const FILE_LIMIT = limits.filesPerSync === Infinity
      ? SAFE_MAX
      : Math.min(limits.filesPerSync, SAFE_MAX);

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
      console.error(`[Webhook] Tree fetch failed: ${treeRes.status}`);
      await notify(userId, 'error', 'Sync Failed',
        `Could not reach ${fullName}. Check repo visibility.`,
        `/dashboard/projects/${project.id}/doc`
      );
      return NextResponse.json({ message: 'Failed to access repository tree.' }, { status: 200 });
    }

    const { tree } = await treeRes.json();
    const filesToSync = tree
      .filter((f: any) => f.type === 'blob')
      .filter((f: any) => !f.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i))
      .slice(0, FILE_LIMIT);

    // 5. Atomic Wipe ───────────────────────────────────────────────────────────
    await supabase.from('code_memories').delete().eq('project_id', project.id);

    // 6. Download & Inject Files ───────────────────────────────────────────────
    let syncedCount = 0;
    const syncedPaths: string[] = [];
    const syncedAt = new Date().toISOString();

    for (const file of filesToSync) {
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
    const maturityScore = calculateMaturity(syncedPaths);
    const capped = filesToSync.length >= FILE_LIMIT;

    await supabase
      .from('projects')
      .update({
        maturity_score:    maturityScore,
        updated_at:        syncedAt,
        last_sync:         syncedAt,
        deployment_status: 'synced',
      })
      .eq('id', project.id);

    // 8. Send Notification — FIX 1 IN ACTION ──────────────────────────────────
    // Inserting here triggers the realtime listener in NotificationContext,
    // which updates the bell badge and shows the toast in the panel instantly.
    await notify(
      userId,
      capped ? 'warning' : 'success',
      capped ? '⚡ Sync Capped' : '⚡ Auto-Sync Complete',
      capped
        ? `${syncedCount} of ${FILE_LIMIT} files synced from ${fullName}. Upgrade for more.`
        : `${syncedCount} files synced from ${fullName}. Maturity: ${maturityScore}%.`,
      `/dashboard/projects/${project.id}/doc`
    );

    console.log(`[Webhook] Done — ${syncedCount} files, maturity ${maturityScore}%, notification sent`);

    return NextResponse.json({
      status:         'Neural Sync Complete via Webhook',
      node:           repoName,
      files_synced:   syncedCount,
      maturity_score: maturityScore,
      timestamp:      syncedAt,
    }, { status: 200 });

  } catch (error) {
    console.error('[Webhook] Internal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
