import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits, PlanType } from '../../../../lib/plans'

function calculateMaturity(filePaths: string[]): number {
  let score = 15
  const paths = filePaths.join(' ').toLowerCase()
  if (paths.includes('package.json') || paths.includes('requirements.txt')) score += 10
  if (paths.includes('tsconfig.json') || paths.includes('dockerfile')) score += 10
  if (paths.includes('bitbucket-pipelines.yml')) score += 15
  if (paths.includes('readme.md')) score += 10
  if (paths.includes('/docs') || paths.includes('changelog')) score += 5
  if (paths.includes('.test.') || paths.includes('.spec.') || paths.includes('/tests/')) score += 20
  const volumeScore = Math.min(15, Math.floor(filePaths.length / 5))
  score += volumeScore
  return Math.min(100, score)
}

async function notify(
  supabase: any,
  userId: string,
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message: string,
  link?: string
) {
  await supabase.from('notifications').insert({
    user_id: userId, type, title, message, link: link || null
  })
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
      const { data: profile } = await supabase
        .from('profiles').select('plan_type').eq('id', userId).single()
      plan = (profile?.plan_type as PlanType) || 'free'
    }
    const limits = getLimits(plan)

    if (!limits.providers.includes('bitbucket')) {
      if (userId) await notify(supabase, userId, 'error', 'Upgrade Required',
        'Bitbucket sync requires Pro or Platinum. Upgrade in Settings.')
      return NextResponse.json(
        { success: false, upgrade: true, error: 'Bitbucket sync requires Pro or Platinum.' },
        { status: 403 }
      )
    }

    const FILE_LIMIT = limits.filesPerSync === Infinity ? 9999 : limits.filesPerSync

    const authHeaders: Record<string, string> = {}
    // Always add token if available — lets Bitbucket decide access
    if (process.env.BITBUCKET_TOKEN) {
      authHeaders['Authorization'] = `Basic ${process.env.BITBUCKET_TOKEN}`
    }

    let nextUrl = `https://api.bitbucket.org/2.0/repositories/${repo}/src/main/?max_depth=10`
    const check = await fetch(nextUrl, { headers: authHeaders })
    if (!check.ok) {
      nextUrl = `https://api.bitbucket.org/2.0/repositories/${repo}/src/master/?max_depth=10`
      const checkMaster = await fetch(nextUrl, { headers: authHeaders })
      if (!checkMaster.ok) {
        if (userId) await notify(supabase, userId, 'error', 'Sync Failed',
          `Could not reach ${repo} on Bitbucket. Check if it's private or missing.`)
        throw new Error(`Bitbucket Error: Could not find main or master branch for ${repo}.`)
      }
    }

    let allFiles: any[] = []
    while (nextUrl && allFiles.length < FILE_LIMIT) {
      const res = await fetch(nextUrl, { headers: authHeaders })
      if (!res.ok) break
      const data = await res.json()
      allFiles = [...allFiles, ...data.values.filter((i: any) => i.type === 'commit_file')]
      nextUrl = data.next || null
    }

    const SKIP_EXT = /\.(png|jpg|jpeg|gif|ico|bmp|webp|svg|avif|pdf|zip|tar|gz|rar|7z|mp4|mp3|wav|mov|woff|woff2|ttf|eot|otf|exe|dll|so|dylib|bin|lock|sum|snap)$/i
    const SKIP_PATH = /(^node_modules\/|^\.next\/|^dist\/|^build\/|^out\/|^\.git\/|^coverage\/|^__pycache__\/|^\.cache\/|^\.turbo\/|^\.vercel\/|\.min\.js$|\.min\.css$|\.map$|\.d\.ts$)/i

    allFiles = allFiles
      .filter((f: any) => !SKIP_EXT.test(f.path))
      .filter((f: any) => !SKIP_PATH.test(f.path))
      .slice(0, FILE_LIMIT)

    await supabase.from('code_memories').delete().eq('project_id', projectId)

    let syncedCount = 0
    const syncedPaths: string[] = []

    for (const file of allFiles) {
      const fileRes = await fetch(file.links.self.href, { headers: authHeaders })
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

    // THE FIX: stamp updated_at and last_sync so the dashboard card
    // shows the real sync time and Realtime broadcasts the change.
    const syncedAt = new Date().toISOString()

    await supabase
      .from('projects')
      .update({
        maturity_score:    maturityScore,
        updated_at:        syncedAt,
        last_sync:         syncedAt,
        deployment_status: 'synced',
        repo_full_name:    repo,         // saves repo so webhook auto-sync matches
        provider:          'bitbucket',
      })
      .eq('id', projectId)

    if (userId) {
      const capped = allFiles.length >= FILE_LIMIT
      await notify(
        supabase, userId,
        capped ? 'warning' : 'success',
        capped ? 'Sync Capped' : 'Sync Complete',
        capped
          ? `Only ${syncedCount} of ${FILE_LIMIT} files pulled from ${repo}. Upgrade to sync more.`
          : `⚡ ${syncedCount} files synced from Bitbucket (${repo}).`,
        `/dashboard/projects/${projectId}/doc`
      )
    }

    return NextResponse.json({
      success: true,
      count: syncedCount,
      score: maturityScore,
      plan,
      limit: FILE_LIMIT,
      capped: allFiles.length >= FILE_LIMIT,
      syncedAt,
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
