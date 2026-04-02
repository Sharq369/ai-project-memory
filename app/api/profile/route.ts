// app/api/profile/route.ts
// Server-side profile update — uses service role key which bypasses RLS.
// Handles: display_name update, avatar_url update.
// Auth is verified via the user's JWT before any DB write.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Service role client — bypasses RLS completely
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // 1. Verify the user is authenticated via their session cookie
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

    const { data: { user }, error: authError } = await ssrClient.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Parse the update payload
    const body = await req.json()
    const { display_name, avatar_url } = body

    // Only allow known fields
    const updates: Record<string, string> = {}
    if (display_name !== undefined) updates.display_name = display_name.trim()
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // 3. Upsert using service role — bypasses RLS, always succeeds
    const { error: upsertError } = await adminSupabase
      .from('profiles')
      .upsert(
        { id: user.id, ...updates },
        { onConflict: 'id' }
      )

    if (upsertError) {
      console.error('Profile upsert error:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updates })

  } catch (err: any) {
    console.error('Profile route error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
