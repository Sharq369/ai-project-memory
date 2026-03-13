import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits, PlanType } from '../../../../lib/plans'

function calculateMaturity(filePaths: string[]): number {
  let score = 15;
  const paths = filePaths.join(' ').toLowerCase();

  if (paths.includes('package.json') || paths.includes('requirements.txt')) score += 10;
  if (paths.includes('tsconfig.json') || paths.includes('dockerfile')) score += 10;
  if (paths.includes('.gitlab-ci.yml') || paths.includes('.github/workflows')) score += 15;
  if (paths.includes('readme.md')) score += 10;
  if (paths.includes('/docs') || paths.includes('changelog')) score += 5;
  if (paths.includes('.test.') || paths.includes('.spec.') || paths.includes('/tests/')) score += 20;
  
  const volumeScore = Math.min(15, Math.floor(filePaths.length / 5));
  score += volumeScore;

  return Math.min(100, score);
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

    if (!limits.providers.includes('gitlab')) {
      return NextResponse.json({ success: false, upgrade: true, error: 'GitLab sync requires Pro or Platinum. Upgrade in Settings.' }, { status: 403 })
    }

    const FILE_LIMIT = limits.filesPerSync === Infinity ? 9999 : limits.filesPerSync
    const encodedRepo = encodeURIComponent(repo)

    const authHeaders: Record<string, string> = {}
    if (limits.privateRepos && process.env.GITLAB_TOKEN) {
      authHeaders['PRIVATE-TOKEN'] = process.env.GITLAB_TOKEN
    }

    const treeRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/tree?recursive=true&per_page=100`, { headers: authHeaders })
    if (!treeRes.ok) throw new Error('GitLab project not found or private.')
    const tree = await treeRes.json()
    
    const files = tree
      .filter((f: any) => f.type === 'blob')
      .filter((f: any) => !f.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i))
      .slice(0, FILE_LIMIT)

    let syncedCount = 0
    const syncedPaths: string[] = []

    for (const file of files) {
      let fileRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=main`, { headers: authHeaders })
      if (!fileRes.ok) fileRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=master`, { headers: authHeaders })
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

    const maturityScore = calculateMaturity(syncedPaths);
    await supabase.from('projects').update({ maturity_score: maturityScore }).eq('id', projectId);

    return NextResponse.json({
      success: true,
      count: syncedCount,
      score: maturityScore,
      plan,
      limit: FILE_LIMIT,
      capped: files.length >= FILE_LIMIT
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
