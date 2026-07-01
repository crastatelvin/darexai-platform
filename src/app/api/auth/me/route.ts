import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { db } from '@/lib/db';

export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    include: { tenant: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
    },
  });
});
