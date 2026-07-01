import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 });
  }

  const decoded = verifyToken(refreshToken);
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  try {
    // Check if token exists and is not revoked
    const storedToken = await db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      // Security warning: possible token theft! Revoke all tokens for user.
      if (storedToken) {
        await db.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { revoked: true },
        });
      }
      
      const response = NextResponse.json({ error: 'Token revoked or expired' }, { status: 401 });
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }

    const { user } = storedToken;

    // Rotate refresh token
    const newAccessToken = signAccessToken({ userId: user.id, tenantId: user.tenantId });
    const newRefreshTokenString = signRefreshToken(user.id);

    // Delete old refresh token, persist new one
    await db.refreshToken.delete({ where: { id: storedToken.id } });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.refreshToken.create({
      data: {
        token: newRefreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    const response = NextResponse.json({ success: true });
    
    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set('refresh_token', newRefreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
