import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.redirect(new URL('/dashboard/projects?error=github_no_code', req.url));

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await res.json();

    if (data.access_token) {
      console.log("GitHub Neural Link Established.");
      // TODO: Save data.access_token to Supabase here later
      return NextResponse.redirect(new URL('/dashboard/projects?status=github_connected', req.url));
    }

    return NextResponse.redirect(new URL('/dashboard/projects?error=github_token_failed', req.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/dashboard/projects?error=github_server_error', req.url));
  }
}
