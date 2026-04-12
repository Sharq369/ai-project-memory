// app/api/projects/register-webhook/route.ts
// Manually triggers webhook registration for an existing project card.
//
// FIX: Now passes projectId into fireFlareGun so it can stamp repo_full_name
// on the project row immediately — ensuring auto-sync works going forward.

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

    // FIX: Pass projectId so fireFlareGun stamps repo_full_name immediately
    const result = await fireFlareGun(user.id, repoUrl, projectId)

    // webhook_registered is now handled inside fireFlareGun when projectId is given
    // but keep this as a safety net for the skipped case
    if (!result.success && !result.skipped) {
      // Registration failed — don't stamp webhook_registered
    } else if (result.skipped) {
      // No token — don't update anything, just return skipped
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
