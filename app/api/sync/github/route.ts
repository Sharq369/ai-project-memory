import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits, PlanType } from '../../../../lib/plans'

function calculateMaturity(filePaths: string[]): number {
  let score = 15
  const paths = filePaths.join(' ').toLowerCase()
  if (paths.includes('package.json') || paths.includes('requirements.txt')) score += 10
  if (paths.includes('tsconfig.json') || paths.includes('dockerfile')) score += 10
  if (paths.includes('.github/workflows') || paths.includes('.gitlab-ci.yml')) score += 15
  if (paths.includes('readme.md')) score += 10
  if (paths.includes('/docs') || paths.includes('changelog')) score += 5
  if (paths.includes('.test.') || paths.includes('.spec.') || paths.includes('/tests/')) score += 20
  const volumeScore = Math.min(15, Math.floor(filePaths.length / 5))
  score += volumeScore
  return Math.min(100, score)
}

// Insert a notification row — client realtime picks it up instantly
async function notify(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message: string,
  link?: string
) {
  await supabase.from('notifications').insert({ user_id: userId, type, title, message, link: link || null })
}

export async function POST(req: Request) {
  try {
    const { repo, projectId, userId } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let plan: PlanType = 'free'
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('plan_type').eq('id', userId).single()
      plan = (profile?.plan_type as PlanType) || 'free'
    }
    const limits = getLimits(plan)
    const FILE_LIMIT = limits.filesPerSync === Infinity ? 9999 : limits.filesPerSync

    const authHeaders: Record<string, string> = {}
    if (limits.privateRepos && process.env.GITHUB_TOKEN) {
      authHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers: authHeaders })
    if (!repoRes.ok) {
      if (userId) await notify(supabase, userId, 'error', 'Sync Failed', `Could not reach ${repo}. Check the repo name and visibility.`)
      throw new Error(`GitHub Error: ${repoRes.status}. Check repo is public.`)
    }

    const { default_branch } = await repoRes.json()

    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${default_branch}?recursive=1`, { headers: authHeaders })
    if (!treeRes.ok) throw new Error('Failed to fetch file tree.')
    const { tree } = await treeRes.json()

    const files = tree
      .filter((f: any) => f.type === 'blob')
      .filter((f: any) => !f.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i))
      .slice(0, FILE_LIMIT)

    // Delete existing files before re-sync — prevents unique constraint error
    await supabase.from('code_memories').delete().eq('project_id', projectId)

    let syncedCount = 0
    const syncedPaths: string[] = []

    for (const file of files) {
      const fileRes = await fetch(`https://raw.githubusercontent.com/${repo}/${default_branch}/${file.path}`)
      if (!fileRes.ok) continue
      const { error } = await supabase.from('code_memories').insert({
        project_id: projectId,
        file_name: file.path,
        content: await fileRes.text()
      })
      if (error) throw new Error(error.message)
      syncedCount++
      syncedPaths.push(file.path)
    }

    const maturityScore = calculateMaturity(syncedPaths)
    await supabase.from('projects').update({ maturity_score: maturityScore }).eq('id', projectId)

    // Push notification to client via realtime
    if (userId) {
      const capped = files.length >= FILE_LIMIT
      await notify(
        supabase, userId,
        capped ? 'warning' : 'success',
        capped ? 'Sync Capped' : 'Sync Complete',
        capped
          ? `Only ${syncedCount} of ${FILE_LIMIT} files pulled from ${repo}. Upgrade to sync more.`
          : `${syncedCount} files synced from ${repo}.`,
        `/dashboard/projects/${projectId}/doc`
      )
    }

    return NextResponse.json({ success: true, count: syncedCount, score: maturityScore, plan, limit: FILE_LIMIT, capped: files.length >= FILE_LIMIT })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
