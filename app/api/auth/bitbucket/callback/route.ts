import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.redirect(new URL('/dashboard/projects?error=bitbucket_no_code', req.url));

  try {
    // Bitbucket requires Base64 encoded credentials
    const credentials = Buffer.from(`${process.env.NEXT_PUBLIC_BITBUCKET_CLIENT_ID}:${process.env.BITBUCKET_CLIENT_SECRET}`).toString('base64');

    const res = await fetch('https://bitbucket.org/site/oauth2/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const data = await res.json();

    if (data.access_token) {
      console.log("Bitbucket Neural Link Established.");
      // TODO: Save data.access_token to Supabase here later
      return NextResponse.redirect(new URL('/dashboard/projects?status=bitbucket_connected', req.url));
    }

    return NextResponse.redirect(new URL('/dashboard/projects?error=bitbucket_token_failed', req.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/dashboard/projects?error=bitbucket_server_error', req.url));
  }
}
