import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || 'testowner@darexai.com';
    const name = body.name || 'Demo Business Owner';

    // Find or create tenant + user (Auto Onboarding)
    let user = await db.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      // Onboard mock tenant
      const tenant = await db.tenant.create({
        data: {
          name: `${name}'s Workspace`,
        },
      });

      user = await db.user.create({
        data: {
          email,
          name,
          role: 'OWNER',
          tenantId: tenant.id,
        },
        include: { tenant: true },
      });

      await db.auditLog.create({
        data: {
          action: 'ONBOARD_TENANT_MOCK',
          details: `Provisioned mock tenant: ${tenant.name}`,
          tenantId: tenant.id,
          userId: user.id,
        },
      });
    }

    // Auto-hydrate mock data for tenant
    try {
      const { seedTenantData } = await import('@/lib/seed');
      await seedTenantData(user.tenantId);
    } catch (seedErr) {
      console.error('Failed to seed mock tenant data:', seedErr);
    }

    // Sign tokens
    const accessToken = signAccessToken({ userId: user.id, tenantId: user.tenantId });
    const refreshTokenString = signRefreshToken(user.id);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    
    // Set cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set('refresh_token', refreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Mock login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
