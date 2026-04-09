// app/api/projects/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Handles project creation server-side so we can fire the webhook flare gun
// immediately after the row is inserted, using the user's encrypted PAT.
//
// POST body: { repoUrl?: string }
//   - repoUrl is optional. If provided, webhook auto-registration fires.
//   - If not provided, project is created with a default name (user renames later).
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
    // 1. Auth ──────────────────────────────────────────────────────────────────
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const repoUrl: string | undefined = body.repoUrl?.trim() || undefined

    // 2. Derive project name from repo URL if provided ─────────────────────────
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

    // 3. Insert project row ────────────────────────────────────────────────────
    const { data: project, error: insertError } = await adminSupabase
      .from('projects')
      .insert({
        name: projectName,
        user_id: user.id,
        ...(repoFullName && { repo_full_name: repoFullName }),
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

    // 4. Fire the flare gun — async, non-blocking ──────────────────────────────
    // We don't await this — project creation succeeds regardless of webhook result.
    // The result is included in the response for the UI to show a status indicator.
    let webhookResult = null

    if (repoUrl) {
      // Fire and collect result — we do await here so the response includes status
      // but project creation is already committed regardless of outcome
      webhookResult = await fireFlareGun(user.id, repoUrl)
      console.log(`[ProjectCreate] Flare gun result:`, webhookResult)

      // If registration succeeded, stamp webhook_registered on the project row
      if (webhookResult.success && webhookResult.hookId) {
        await adminSupabase
          .from('projects')
          .update({ webhook_registered: true })
          .eq('id', project.id)
      }
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
