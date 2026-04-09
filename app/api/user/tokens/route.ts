// app/api/user/tokens/route.ts
// Handles encrypted PAT storage for GitHub, GitLab, Bitbucket.
// Auth: uses SSR cookie-based session — no manual Authorization header needed.
// Encryption: AES-256-CBC via Node crypto.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// ── Service role client — bypasses RLS for writes ────────────────────────────
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Encryption ────────────────────────────────────────────────────────────────
// ENCRYPTION_KEY must be exactly 32 characters in your .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_32_character_fallback_key!';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// ── Auth helper — verify session via SSR cookie ───────────────────────────────
async function getAuthUser() {
  const cookieStore = cookies();
  const ssrClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    }
  );
  const { data: { user } } = await ssrClient.auth.getUser();
  return user;
}

// ── GET /api/user/tokens — returns boolean connection status only ─────────────
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('github_token, gitlab_token, bitbucket_token')
      .eq('id', user.id)
      .single();

    // NEVER return the token itself — boolean only
    return NextResponse.json({
      status: {
        github:    !!profile?.github_token,
        gitlab:    !!profile?.gitlab_token,
        bitbucket: !!profile?.bitbucket_token,
      }
    });

  } catch (err: any) {
    console.error('[Tokens GET] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── POST /api/user/tokens — encrypt and save a token ─────────────────────────
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { provider, token } = body;

    if (!['github', 'gitlab', 'bitbucket'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const encryptedToken = encrypt(token.trim());
    const column = `${provider}_token`;

    const { error } = await adminSupabase
      .from('profiles')
      .upsert({ id: user.id, [column]: encryptedToken }, { onConflict: 'id' });

    if (error) {
      console.error('[Tokens POST] DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[Tokens POST] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE /api/user/tokens?provider=github — nullify a token ────────────────
export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    if (!provider || !['github', 'gitlab', 'bitbucket'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from('profiles')
      .update({ [`${provider}_token`]: null })
      .eq('id', user.id);

    if (error) {
      console.error('[Tokens DELETE] DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[Tokens DELETE] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
