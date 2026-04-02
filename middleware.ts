import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // ─────────────────────────────────────────────────────────────────────────
  // CRITICAL FIX: Exclude the GitHub webhook route from auth middleware.
  //
  // WHY THIS BREAKS AUTO-SYNC:
  // The middleware ran on EVERY route including /api/webhooks/git.
  // When GitHub POSTs to your webhook, it sends no cookie or session.
  // The middleware calls supabase.auth.getUser() which returns null,
  // and depending on Supabase SSR internals, can redirect or corrupt
  // the request before it ever reaches your webhook handler.
  // GitHub receives a 3xx redirect or malformed response, marks the
  // delivery as failed, and auto-sync never fires.
  //
  // FIX: Any path starting with /api/webhooks bypasses middleware entirely.
  // These routes verify their own security via HMAC signature — they don't
  // need session-based auth.
  // ─────────────────────────────────────────────────────────────────────────
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session cookie
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
