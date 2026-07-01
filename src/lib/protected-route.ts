import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export interface ProtectedRouteContext {
  userId: string;
  tenantId: string;
}

export function withAuth(
  handler: (req: NextRequest, ctx: ProtectedRouteContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const accessToken = req.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(accessToken);
    if (!decoded || !decoded.userId || !decoded.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      return await handler(req, {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
      });
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
