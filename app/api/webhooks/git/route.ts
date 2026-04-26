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

// ── HMAC Signature Verification (GitHub) ──────────────────────────────────────
function verifyGitHubSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  // If no secret configured in env, skip verification (allows initial setup)
  // Once WEBHOOK_SECRET is set, it is strictly enforced
  if (!secret) return true;
  if (!signature) return false;
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

// ── Notification Engine ────────────────────────────────────────────────────────
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

// ── THE GATEKEEPER SHIELD ─────────────────────────────────────────────────────
const SKIP_EXT = /\.(png|jpg|jpeg|gif|ico|bmp|webp|svg|avif|pdf|zip|tar|gz|rar|7z|mp4|mp3|wav|mov|woff|woff2|ttf|eot|otf|exe|dll|so|dylib|bin|lock|sum|snap)$/i;
const SKIP_PATH = /(^node_modules\/|^\.next\/|^dist\/|^build\/|^out\/|^\.git\/|^coverage\/|^__pycache__\/|^\.cache\/|^\.turbo\/|^\.vercel\/|\.min\.js$|\.min\.css$|\.map$|\.d\.ts$)/i;
const SKIP_NAME = /^(package-lock\.json|pnpm-lock\.yaml|poetry\.lock|Pipfile\.lock|Gemfile\.lock|composer\.lock|packages\.lock\.json)$/i;

// FIX: was using includes() — 'out' matched inside 'route.ts' filtering ALL API routes
function isJunk(path: string): boolean {
  if (!path) return true;
  const filename = path.split('/').pop() || '';
  return SKIP_EXT.test(path) || SKIP_PATH.test(path) || SKIP_NAME.test(filename);
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const bodyText  = await req.text();
    const payload = JSON.parse(bodyText);
    
    const signature = req.headers.get('x-hub-signature-256');
    const githubEvent = req.headers.get('x-github-event'); 

    // 1. Security Gate (GitHub specific check) ─────────────────────────────────
    if (githubEvent && !verifyGitHubSignature(bodyText, signature)) {
      console.error('[Webhook] Unauthorized — GitHub signature mismatch');
      return NextResponse.json({ error: 'Unauthorized Handshake' }, { status: 401 });
    }

    // ── 2. UNIVERSAL CI/CD PIPELINE GATEKEEPER ────────────────────────────────
    
    // Provider 1: GitHub Logic
    if (githubEvent === 'workflow_run') {
      if (payload.action !== 'completed') {
        console.log(`[Webhook] GitHub workflow still running. Ignoring.`);
        return NextResponse.json({ message: 'Workflow running, ignoring.' }, { status: 200 });
      }
      if (payload.workflow_run.conclusion !== 'success') {
        console.warn(`[Webhook] GitHub commit failed CI/CD (${payload.workflow_run.conclusion}). Sync aborted to protect Memory Vault.`);
        return NextResponse.json({ message: 'Commit failed tests. Sync aborted.' }, { status: 200 });
      }
      if (payload.workflow_run.head_branch !== payload.repository?.default_branch) {
         console.log(`[Webhook] Successful build, but not on default branch. Ignoring.`);
         return NextResponse.json({ message: 'Not default branch. Ignoring.' }, { status: 200 });
      }
    } 
    
    // Provider 2: GitLab Logic
    else if (payload.object_kind === 'pipeline') {
       if (payload.object_attributes?.status !== 'success') {
          console.warn(`[Webhook] GitLab pipeline failed (${payload.object_attributes?.status}). Sync aborted.`);
          return NextResponse.json({ message: 'Pipeline failed. Sync aborted.' }, { status: 200 });
       }
    }
    
    // Provider 3: Bitbucket Logic
    else if (payload.commit_status) {
       if (payload.commit_status.state !== 'SUCCESSFUL') {
          console.warn(`[Webhook] Bitbucket build is ${payload.commit_status.state}. Sync aborted.`);
          return NextResponse.json({ message: 'Bitbucket build not successful. Sync aborted.' }, { status: 200 });
       }
    }
    
    // Push event fallback — fires when repo has NO CI/CD workflow
    // Verifies the pushed commit has no failing checks before syncing
    else if (githubEvent === 'push' || payload.object_kind === 'push') {
      const pushedBranch = payload.ref?.replace('refs/heads/', '') ||
                           payload.commits?.[0]?.branch ||
                           payload.push?.changes?.[0]?.new?.name;
      const repoDefault = payload.repository?.default_branch ||
                          payload.project?.default_branch || 'main';

      // Ignore non-default branch pushes
      if (pushedBranch && pushedBranch !== repoDefault) {
        console.log(`[Webhook] Push to non-default branch (${pushedBranch}). Ignoring.`);
        return NextResponse.json({ message: 'Not default branch. Ignoring.' }, { status: 200 });
      }

      // For GitHub: verify commit status before syncing
      // This catches repos that have status checks (e.g. external CI) but no workflow_run
      if (githubEvent === 'push') {
        const headSha = payload.after || payload.head_commit?.id;
        const pushFullName = payload.repository?.full_name;

        if (headSha && pushFullName) {
          const pushAuthHeaders: Record<string, string> = { Accept: 'application/vnd.github+json' };
          if (process.env.GITHUB_TOKEN) pushAuthHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;

          // Check combined commit status (external CI tools like CircleCI, Travis etc.)
          const statusRes = await fetch(
            `https://api.github.com/repos/${pushFullName}/commits/${headSha}/status`,
            { headers: pushAuthHeaders }
          );

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            // 'failure' or 'error' = bad commit — abort sync
            if (statusData.state === 'failure' || statusData.state === 'error') {
              console.warn(`[Webhook] Push commit ${headSha.slice(0,7)} has failing status checks (${statusData.state}). Sync aborted.`);
              return NextResponse.json({ message: 'Commit has failing checks. Sync aborted.' }, { status: 200 });
            }
          }

          // Also check GitHub check runs (Actions-based checks without workflow_run event)
          const checksRes = await fetch(
            `https://api.github.com/repos/${pushFullName}/commits/${headSha}/check-runs`,
            { headers: pushAuthHeaders }
          );

          if (checksRes.ok) {
            const checksData = await checksRes.json();
            const runs = checksData.check_runs || [];
            const hasFailure = runs.some((r: any) =>
              r.status === 'completed' && (r.conclusion === 'failure' || r.conclusion === 'cancelled' || r.conclusion === 'timed_out')
            );
            if (hasFailure) {
              console.warn(`[Webhook] Push commit ${headSha.slice(0,7)} has failed check runs. Sync aborted.`);
              return NextResponse.json({ message: 'Commit has failed checks. Sync aborted.' }, { status: 200 });
            }
          }
        }
      }

      // Passed all checks — safe to sync
      console.log(`[Webhook] Push to default branch verified. Proceeding with sync.`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Extract repository details robustly across providers
    const repoName      = payload.repository?.name || payload.project?.name;
    const fullName      = payload.repository?.full_name || payload.project?.path_with_namespace;
    const defaultBranch = payload.repository?.default_branch || 'main';

    if (!repoName || !fullName) {
      return NextResponse.json({ message: 'Invalid payload or unhandled event, ignoring.' }, { status: 200 });
    }

    console.log(`[Webhook] Verified successful build from: ${fullName}`);

    // 3. Locate Target Node — three-pass lookup ───────────────────────────────
    let project: { id: string; user_id: string } | null = null;
    let autoSaveRepoName = false;

    const { data: pass1 } = await supabase
      .from('projects')
      .select('id, user_id, repo_full_name')
      .eq('repo_full_name', fullName)
      .maybeSingle();
    if (pass1) { project = pass1; }

    if (!project) {
      const { data: pass2 } = await supabase
        .from('projects')
        .select('id, user_id, repo_full_name')
        .ilike('repo_url', `%${fullName}%`)
        .maybeSingle();
      if (pass2) { project = pass2; autoSaveRepoName = true; }
    }

    if (!project) {
      const { data: pass3 } = await supabase
        .from('projects')
        .select('id, user_id, repo_full_name')
        .ilike('name', repoName)
        .maybeSingle();
      if (pass3) { project = pass3; autoSaveRepoName = true; }
    }

    if (!project) {
      console.warn(`[Webhook] No active Neural Node found for: ${fullName}`);
      return NextResponse.json({ message: 'Node not found, ignoring.' }, { status: 200 });
    }

    if (autoSaveRepoName) {
      await supabase
        .from('projects')
        .update({ repo_full_name: fullName })
        .eq('id', project.id);
    }

    const userId = project.user_id;

    // 4. Plan Gate ─────────────────────────────────────────────────────────────
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

    // DEVELOPER_IDS always bypass the auto-sync gate regardless of plan
    if (!limits.webhookAutoSync && !DEVELOPER_IDS.includes(userId)) {
      return NextResponse.json(
        { message: 'Auto-sync requires Pro or Platinum tier.' },
        { status: 200 }
      );
    }

    const SAFE_MAX   = 150;
    const FILE_LIMIT = limits.filesPerSync === Infinity
      ? SAFE_MAX
      : Math.min(limits.filesPerSync, SAFE_MAX);

    // 5. Fetch File Tree ───────────────────────────────────────────────────────
    const authHeaders: Record<string, string> = {};
    // Always attach token if available — lets GitHub decide access for private repos
    // Public repos ignore the token; private repos require it
    if (process.env.GITHUB_TOKEN) {
      authHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const treeRes = await fetch(
      `https://api.github.com/repos/${fullName}/git/trees/${defaultBranch}?recursive=1`,
      { headers: authHeaders }
    );

    if (!treeRes.ok) {
      console.error(`[Webhook] Tree fetch failed: ${treeRes.status}`);
      await notify(userId, 'error', 'Sync Failed',
        `Could not reach ${fullName}. Check repository visibility.`,
        `/dashboard/projects/${project.id}/doc`
      );
      return NextResponse.json({ message: 'Failed to access repository tree.' }, { status: 200 });
    }

    const { tree } = await treeRes.json();
    
    // NEW GATEKEEPER LOGIC HERE:
    const filesToSync = tree
      .filter((f: any) => f.type === 'blob')
      .filter((f: any) => !isJunk(f.path)) // Drops all the heavy folders and lockfiles instantly
      .slice(0, FILE_LIMIT);

    // 6. Atomic Wipe ───────────────────────────────────────────────────────────
    await supabase.from('code_memories').delete().eq('project_id', project.id);

    // 7. Download & Inject Files ───────────────────────────────────────────────
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

    // 8. Update Project State ──────────────────────────────────────────────────
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

    // 9. Send Notification ─────────────────────────────────────────────────────
    await notify(
      userId,
      capped ? 'warning' : 'success',
      capped ? '⚡ Sync Capped' : '⚡ Auto-Sync Complete',
      capped
        ? `${syncedCount} of ${FILE_LIMIT} files synced from ${fullName}. Upgrade for more.`
        : `${syncedCount} files verified and synced from ${fullName}. Maturity: ${maturityScore}%.`,
      `/dashboard/projects/${project.id}/doc`
    );

    return NextResponse.json({
      status:         'Neural Sync Complete via Verified CI/CD Webhook',
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
