// app/api/admin/route.ts
// Serves user management + usage analytics data for the admin panel.
// SECURITY: Only DEVELOPER_IDS can access this endpoint.
// All queries use service role key — bypasses RLS to see all users.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const ADMIN_IDS = ['33157b98-fdd0-4e04-b14b-bee4352f80c7']

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

export async function GET(req: Request) {
  try {
    // ── Auth guard — only admin can access ──────────────────────────────────
    const user = await getAuthUser()
    if (!user || !ADMIN_IDS.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIso = today.toISOString()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString()

    // ── 1. All users from auth.users via profiles ───────────────────────────
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, plan_type, display_name, avatar_url, updated_at')
      .order('updated_at', { ascending: false })

    // ── 2. Auth users list (email, created_at, last_sign_in) ────────────────
    const { data: authData } = await adminSupabase.auth.admin.listUsers()
    const authUsers = authData?.users || []

    // ── 3. Per-user counts ──────────────────────────────────────────────────
    const [
      { data: projectCounts },
      { data: memoryCounts },
      { data: fileCounts },
    ] = await Promise.all([
      adminSupabase.from('projects').select('user_id'),
      adminSupabase.from('memories').select('user_id'),
      adminSupabase.from('code_memories').select('user_id'),
    ])

    // ── 4. Today's usage logs ───────────────────────────────────────────────
    const [
      { data: aiLogs },
      { data: decompLogs },
    ] = await Promise.all([
      adminSupabase.from('ai_message_log').select('user_id').gte('created_at', todayIso),
      adminSupabase.from('decomposer_log').select('user_id').gte('created_at', todayIso),
    ])

    // ── 5. 30-day activity (new users, memories, projects) ──────────────────
    const [
      { data: recentMemories },
      { data: recentProjects },
    ] = await Promise.all([
      adminSupabase.from('memories').select('created_at').gte('created_at', thirtyDaysAgoIso),
      adminSupabase.from('projects').select('created_at').gte('created_at', thirtyDaysAgoIso),
    ])

    // ── Build per-user count maps ───────────────────────────────────────────
    const countMap = (rows: any[], key = 'user_id') => {
      const map: Record<string, number> = {}
      rows?.forEach(r => { map[r[key]] = (map[r[key]] || 0) + 1 })
      return map
    }

    const projectMap  = countMap(projectCounts || [])
    const memoryMap   = countMap(memoryCounts || [])
    const fileMap     = countMap(fileCounts || [])
    const aiMap       = countMap(aiLogs || [])
    const decompMap   = countMap(decompLogs || [])

    // ── Merge profile + auth data ───────────────────────────────────────────
    const users = authUsers.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id)
      return {
        id:            authUser.id,
        email:         authUser.email || 'Unknown',
        display_name:  profile?.display_name || null,
        avatar_url:    profile?.avatar_url || null,
        plan:          profile?.plan_type || 'free',
        created_at:    authUser.created_at,
        last_sign_in:  authUser.last_sign_in_at || null,
        projects:      projectMap[authUser.id] || 0,
        memories:      memoryMap[authUser.id] || 0,
        files:         fileMap[authUser.id] || 0,
        ai_today:      aiMap[authUser.id] || 0,
        decomp_today:  decompMap[authUser.id] || 0,
      }
    })

    // ── Platform-wide stats ─────────────────────────────────────────────────
    const stats = {
      total_users:     users.length,
      free_users:      users.filter(u => u.plan === 'free').length,
      pro_users:       users.filter(u => u.plan === 'pro').length,
      platinum_users:  users.filter(u => u.plan === 'platinum').length,
      total_projects:  projectCounts?.length || 0,
      total_memories:  memoryCounts?.length || 0,
      total_files:     fileCounts?.length || 0,
      ai_calls_today:  aiLogs?.length || 0,
      decomp_today:    decompLogs?.length || 0,
      new_memories_30d: recentMemories?.length || 0,
      new_projects_30d: recentProjects?.length || 0,
    }

    return NextResponse.json({ users, stats })

  } catch (err: any) {
    console.error('Admin API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── PATCH /api/admin — update a user's plan ──────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user || !ADMIN_IDS.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId, plan } = await req.json()
    if (!userId || !['free', 'pro', 'platinum'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await adminSupabase
      .from('profiles')
      .upsert({ id: userId, plan_type: plan }, { onConflict: 'id' })

    if (error) throw error

    return NextResponse.json({ success: true, userId, plan })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
