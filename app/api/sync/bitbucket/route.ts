import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits, PlanType } from '../../../../lib/plans'

function calculateMaturity(filePaths: string[]): number {
  let score = 15;
  const paths = filePaths.join(' ').toLowerCase();

  if (paths.includes('package.json') || paths.includes('requirements.txt')) score += 10;
  if (paths.includes('tsconfig.json') || paths.includes('dockerfile')) score += 10;
  if (paths.includes('bitbucket-pipelines.yml')) score += 15;
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

    if (!limits.providers.includes('bitbucket')) {
      return NextResponse.json({ success: false, upgrade: true, error: 'Bitbucket sync requires Pro or Platinum. Upgrade in Settings.' }, { status: 403 })
    }

    const FILE_LIMIT = limits.filesPerSync === Infinity ? 9999 : limits.filesPerSync

    const authHeaders: Record<string, string> = {}
    if (limits.privateRepos && process.env.BITBUCKET_TOKEN) {
      authHeaders['Authorization'] = `Basic ${process.env.BITBUCKET_TOKEN}`
    }

    let nextUrl = `https://api.bitbucket.org/2.0/repositories/${repo}/src/main/?max_depth=10`
    const check = await fetch(nextUrl, { headers: authHeaders })
    if (!check.ok) nextUrl = `https://api.bitbucket.org/2.0/repositories/${repo}/src/master/?max_depth=10`

    let allFiles: any[] = []
    while (nextUrl && allFiles.length < FILE_LIMIT) {
      const res = await fetch(nextUrl, { headers: authHeaders })
      if (!res.ok) break
      const data = await res.json()
      allFiles = [...allFiles, ...data.values.filter((i: any) => i.type === 'commit_file')]
      nextUrl = data.next || null
    }
    
    allFiles = allFiles
      .filter((f: any) => !f.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i))
      .slice(0, FILE_LIMIT)

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

    const maturityScore = calculateMaturity(syncedPaths);
    await supabase.from('projects').update({ maturity_score: maturityScore }).eq('id', projectId);

    return NextResponse.json({
      success: true,
      count: syncedCount,
      score: maturityScore,
      plan,
      limit: FILE_LIMIT,
      capped: allFiles.length >= FILE_LIMIT
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
