import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { mongoDb } from '@/lib/mongodb';

export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const conversations = await mongoDb.conversation.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(conversations);
});
