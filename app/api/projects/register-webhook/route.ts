// app/api/projects/register-webhook/route.ts
// Manually triggers webhook registration for an existing project card.
// Used when a project was created before the flare gun existed,
// or when the user adds their PAT after creating the project.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { fireFlareGun } from '../../../../lib/webhook-registration'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthUser() {
  const cookieStore = cookies()
  const ssrClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value }, set() {}, remove() {} } }
  )
  const { data: { user } } = await ssrClient.auth.getUser()
  return user
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, repoUrl } = await req.json()
    if (!projectId || !repoUrl) {
      return NextResponse.json({ error: 'projectId and repoUrl required' }, { status: 400 })
    }

    // Verify project belongs to this user
    const { data: project } = await adminSupabase
      .from('projects')
      .select('id, repo_full_name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Fire the flare gun
    const result = await fireFlareGun(user.id, repoUrl)

    // Stamp webhook_registered if successful
    if (result.success && result.hookId) {
      await adminSupabase
        .from('projects')
        .update({ webhook_registered: true })
        .eq('id', projectId)
    }

    return NextResponse.json({
      registered: result.success,
      skipped: result.skipped || false,
      message: result.message,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
