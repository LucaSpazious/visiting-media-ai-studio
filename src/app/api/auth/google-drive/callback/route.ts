import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const returnTo = searchParams.get('state') || '/';
  const error = searchParams.get('error');

  if (error || !code) {
    const redirectUrl = new URL(returnTo, req.url);
    redirectUrl.searchParams.set('drive_error', error || 'no_code');
    return NextResponse.redirect(redirectUrl);
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/google-drive/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData: TokenResponse = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    const redirectUrl = new URL(returnTo, req.url);
    redirectUrl.searchParams.set('drive_error', tokenData.error || 'token_exchange_failed');
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(new URL(returnTo, req.url));
  response.cookies.set('google_drive_token', tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3500, // ~1 hour, slightly less than Google's token expiry
    path: '/',
  });

  return response;
}
