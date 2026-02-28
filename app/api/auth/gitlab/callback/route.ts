import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.redirect(new URL('/dashboard/projects?error=gitlab_no_code', req.url));

  try {
    const res = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITLAB_CLIENT_ID,
        client_secret: process.env.GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/gitlab/callback`,
      }),
    });

    const data = await res.json();

    if (data.access_token) {
      console.log("GitLab Neural Link Established.");
      // TODO: Save data.access_token to Supabase here later
      return NextResponse.redirect(new URL('/dashboard/projects?status=gitlab_connected', req.url));
    }

    return NextResponse.redirect(new URL('/dashboard/projects?error=gitlab_token_failed', req.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/dashboard/projects?error=gitlab_server_error', req.url));
  }
}
