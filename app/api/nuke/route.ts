// app/api/nuke/route.ts
// Permanently deletes all user data — projects, memories, code_memories.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
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

    const userId = user.id

    // Delete in dependency order
    await supabase.from('code_memories').delete().eq('user_id', userId)
    await supabase.from('memories').delete().eq('user_id', userId)
    await supabase.from('projects').delete().eq('user_id', userId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Nuke error:', error)
    return NextResponse.json({ error: error.message || 'Failed to nuke vault' }, { status: 500 })
  }
}
