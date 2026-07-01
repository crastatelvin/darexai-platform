import { NextResponse } from 'next/server';
import { generatePKCE } from '@/lib/auth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (!googleClientId || googleClientId.includes('your-google-client-id')) {
    return NextResponse.json(
      { error: 'Google Client ID is not configured. Please use Mock Login.' },
      { status: 500 }
    );
  }

  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString('hex');

  const cookieStore = await cookies();
  
  // Save code verifier and state in secure HTTP-only cookies
  cookieStore.set('cv', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });
  
  cookieStore.set('state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code` +
    `&client_id=${encodeURIComponent(googleClientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid%20email%20profile` +
    `&state=${encodeURIComponent(state)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256`;

  return NextResponse.redirect(googleAuthUrl);
}
