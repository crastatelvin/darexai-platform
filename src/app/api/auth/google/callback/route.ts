import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('state')?.value;
  const codeVerifier = cookieStore.get('cv')?.value;

  // Clear PKCE cookies immediately
  cookieStore.delete('state');
  cookieStore.delete('cv');

  if (!code || !state || state !== savedState || !codeVerifier) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=invalid_auth_state`);
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  try {
    // Exchange authorization code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId || '',
        client_secret: googleClientSecret || '',
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google token exchange error:', errorText);
      return NextResponse.redirect(`${appUrl}/?error=token_exchange_failed`);
    }

    const tokens = await response.json();
    const { id_token } = tokens;

    // Decode id_token to get user info
    const payloadBase64 = id_token.split('.')[1];
    const decodedPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64').toString('utf-8')
    );

    const { sub: googleId, email, name } = decodedPayload;

    if (!email) {
      return NextResponse.redirect(`${appUrl}/?error=no_email_provided`);
    }

    // Look up or create user + tenant (Auto Onboarding)
    let user = await db.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
      include: { tenant: true },
    });

    if (!user) {
      // Auto-onboard: create Tenant first
      const tenantName = name ? `${name}'s Workspace` : 'My Workspace';
      const tenant = await db.tenant.create({
        data: {
          name: tenantName,
        },
      });

      // Create user as OWNER
      user = await db.user.create({
        data: {
          email,
          name,
          googleId,
          role: 'OWNER',
          tenantId: tenant.id,
        },
        include: { tenant: true },
      });

      // Log audit entry
      await db.auditLog.create({
        data: {
          action: 'ONBOARD_TENANT',
          details: `Provisioned new tenant: ${tenantName}`,
          tenantId: tenant.id,
          userId: user.id,
        },
      });
    } else if (!user.googleId) {
      // Update existing email-registered user with googleId
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId },
        include: { tenant: true },
      });
    }

    // Auto-hydrate mock data for tenant
    try {
      const { seedTenantData } = await import('@/lib/seed');
      await seedTenantData(user.tenantId);
    } catch (seedErr) {
      console.error('Failed to seed user tenant data:', seedErr);
    }

    // Generate JWT access & refresh tokens
    const accessToken = signAccessToken({ userId: user.id, tenantId: user.tenantId });
    const refreshTokenString = signRefreshToken(user.id);

    // Persist refresh token in PostgreSQL (Refresh Token Rotation)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    // Write cookies and redirect
    const redirectResponse = NextResponse.redirect(`${appUrl}/dashboard`);
    
    // Set cookies in response
    // NextJS Route Handlers can set cookies using response.cookies or lib setAuthCookies
    // We will use standard cookie settings on redirectResponse for callback
    redirectResponse.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 mins
    });

    redirectResponse.cookies.set('refresh_token', refreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return redirectResponse;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${appUrl}/?error=server_error`);
  }
}
