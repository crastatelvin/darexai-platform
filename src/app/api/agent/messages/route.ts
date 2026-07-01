import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { mongoDb } from '@/lib/mongodb';

export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
  }

  // Verify conversation belongs to this tenant
  const conversation = await mongoDb.conversation.findFirst({
    where: { id: conversationId, tenantId: ctx.tenantId },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const messages = await mongoDb.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      createdAt: m.createdAt,
    }))
  );
});
