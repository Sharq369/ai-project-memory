// app/api/profile/route.ts
// Handles both profile data updates AND avatar file uploads.
// Uses service role key — bypasses RLS on profiles table AND storage.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Service role client — bypasses ALL RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify caller is authenticated — returns user or null
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
  const { data: { user }, error } = await ssrClient.auth.getUser()
  if (error || !user) return null
  return user
}

// ── POST /api/profile — update display_name or avatar_url ─────────────────────
export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { display_name, avatar_url } = body

    const updates: Record<string, string> = {}
    if (display_name !== undefined) updates.display_name = display_name.trim()
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error: upsertError } = await adminSupabase
      .from('profiles')
      .upsert({ id: user.id, ...updates }, { onConflict: 'id' })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// ── PUT /api/profile — upload avatar file ─────────────────────────────────────
// Accepts multipart/form-data with a 'file' field
export async function PUT(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `avatars/${user.id}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload using service role — bypasses storage RLS
    const { error: uploadError } = await adminSupabase.storage
      .from('avatars')
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = adminSupabase.storage
      .from('avatars')
      .getPublicUrl(path)

    // Save URL to profiles table using service role
    const { error: dbError } = await adminSupabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: 'id' })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, publicUrl })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
