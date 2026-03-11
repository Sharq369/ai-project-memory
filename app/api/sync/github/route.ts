// app/api/sync/github/route.ts
// FULL REPLACEMENT — adds file limit + private repo enforcement per plan

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits, PlanType } from '../../../lib/plans'

export async function POST(req: Request) {
  try {
    const { repo, projectId, userId } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Get plan limits
    let plan: PlanType = 'free'
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles').select('plan_type').eq('id', userId).single()
      plan = (profile?.plan_type as PlanType) || 'free'
    }
    const limits = getLimits(plan)
    const FILE_LIMIT = limits.filesPerSync === Infinity ? 9999 : limits.filesPerSync

    // 2. Build auth headers — only attach token if plan allows private repos
    const authHeaders: Record<string, string> = {}
    if (limits.privateRepos && process.env.GITHUB_TOKEN) {
      authHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    // 3. Fetch repo default branch
    const repoRes = await fetch(
      `https://api.github.com/repos/${repo}`,
      { headers: authHeaders }
    )
    if (!repoRes.ok) throw new Error(`GitHub Error: ${repoRes.status}. Check repo is public.`)
    const { default_branch } = await repoRes.json()

    // 4. Fetch file tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${repo}/git/trees/${default_branch}?recursive=1`,
      { headers: authHeaders }
    )
    if (!treeRes.ok) throw new Error('Failed to fetch file tree.')
    const { tree } = await treeRes.json()

    // 5. Apply file limit from plan (GEMINI PATCH: Filter media BEFORE slice)
    const files = tree
      .filter((f: any) => f.type === 'blob')
      .filter((f: any) => !f.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|mp4|webp)$/i))
      .slice(0, FILE_LIMIT)

    let syncedCount = 0
    for (const file of files) {
      const fileRes = await fetch(
        `https://raw.githubusercontent.com/${repo}/${default_branch}/${file.path}`
      )
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
