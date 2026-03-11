// app/api/sync/gitlab/route.ts
// FULL REPLACEMENT — blocks free plan + adds file limit

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits, PlanType } from '../../../../lib/plans'

export async function POST(req: Request) {
  try {
    const { repo, projectId, userId } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Get plan
    let plan: PlanType = 'free'
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles').select('plan_type').eq('id', userId).single()
      plan = (profile?.plan_type as PlanType) || 'free'
    }
    const limits = getLimits(plan)

    // 2. Block free users from GitLab entirely
    if (!limits.providers.includes('gitlab')) {
      return NextResponse.json({
        success: false,
        upgrade: true,
        error: 'GitLab sync requires Pro or Platinum. Upgrade in Settings.'
      }, { status: 403 })
    }

    const FILE_LIMIT = limits.filesPerSync === Infinity ? 9999 : limits.filesPerSync
    const encodedRepo = encodeURIComponent(repo)

    const authHeaders: Record<string, string> = {}
    if (limits.privateRepos && process.env.GITLAB_TOKEN) {
      authHeaders['PRIVATE-TOKEN'] = process.env.GITLAB_TOKEN
    }

    // 3. Fetch file tree
    const treeRes = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedRepo}/repository/tree?recursive=true&per_page=100`,
      { headers: authHeaders }
    )
    if (!treeRes.ok) throw new Error('GitLab project not found or private.')

    const tree = await treeRes.json()
    
    // 4. (GEMINI PATCH: Filter media BEFORE slice)
    const files = tree
      .filter((f: any) => f.type === 'blob')
      .filter((f: any) => !f.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i))
      .slice(0, FILE_LIMIT)

    let syncedCount = 0
    for (const file of files) {
      let fileRes = await fetch(
        `https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=main`,
        { headers: authHeaders }
      )
      if (!fileRes.ok) {
        fileRes = await fetch(
          `https://gitlab.com/api/v4/projects/${encodedRepo}/repository/files/${encodeURIComponent(file.path)}/raw?ref=master`,
          { headers: authHeaders }
        )
      }
      if (!fileRes.ok) continue

      const { error } = await supabase.from('code_memories').insert({
        project_id: projectId,
        file_name: file.path,
        content: await fileRes.text()
      })
      if (error) throw new Error(error.message)
      syncedCount++
    }

    return NextResponse.json({
      success: true,
      count: syncedCount,
      plan,
      limit: FILE_LIMIT,
      capped: files.length >= FILE_LIMIT
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
