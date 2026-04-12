// app/api/projects/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Handles project creation server-side so we can fire the webhook flare gun
// immediately after the row is inserted.
//
// FIX: Now passes the new project.id into fireFlareGun so repo_full_name
// gets stamped on the row at creation time — not only after the first sync.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { fireFlareGun, parseRepoUrl } from '../../../lib/webhook-registration'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthUser() {
  const cookieStore = cookies()
  const ssrClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
  const { data: { user } } = await ssrClient.auth.getUser()
  return user
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const repoUrl: string | undefined = body.repoUrl?.trim() || undefined

    // Derive project name + metadata from repo URL if provided
    let projectName = 'New Neural Node'
    let repoFullName: string | undefined
    let provider: string | undefined

    if (repoUrl) {
      const parsed = parseRepoUrl(repoUrl)
      if (parsed) {
        projectName = parsed.repo
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
        repoFullName = parsed.fullName
        provider = parsed.provider
      }
    }

    // Insert project row — include repo_full_name from the start if we can parse it
    const { data: project, error: insertError } = await adminSupabase
      .from('projects')
      .insert({
        name: projectName,
        user_id: user.id,
        ...(repoFullName && { repo_full_name: repoFullName }),  // ← stamp immediately
        ...(repoUrl && { repo_url: repoUrl }),
        ...(provider && { provider }),
      })
      .select()
      .single()

    if (insertError || !project) {
      console.error('[ProjectCreate] Insert error:', insertError)
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create project' },
        { status: 500 }
      )
    }

    console.log(`[ProjectCreate] Created project ${project.id} for user ${user.id}`)

    // Fire the flare gun — FIX: pass project.id so fireFlareGun stamps
    // repo_full_name even if the URL parse succeeded above (idempotent)
    let webhookResult = null

    if (repoUrl) {
      webhookResult = await fireFlareGun(user.id, repoUrl, project.id)
      console.log(`[ProjectCreate] Flare gun result:`, webhookResult)
    }

    return NextResponse.json({
      success: true,
      project,
      webhook: webhookResult
        ? {
            registered: webhookResult.success,
            skipped: webhookResult.skipped || false,
            message: webhookResult.message,
          }
        : null,
    })

  } catch (err: any) {
    console.error('[ProjectCreate] Unexpected error:', err)
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}
