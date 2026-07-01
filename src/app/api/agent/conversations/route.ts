import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { mongoDb } from '@/lib/mongodb';

export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { tenantId, userId } = ctx;

  let conversations = await mongoDb.conversation.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
  });

  if (conversations.length === 0) {
    // Seed conversations from screenshot (Image 4)
    const seedData = [
      {
        title: 'Rahul Sharma',
        messages: [
          { sender: 'user', text: 'Hi Sanu, can we hop on a call tomorrow at 11? I\'d like to lock in the annual pricing we discussed.' },
          { sender: 'assistant', text: 'Absolutely. I\'ll send a Google Meet invite for 11. Anything specific you\'d like me to prep?' },
          { sender: 'assistant', text: 'Hi Rahul — confirmed 11 AM tomorrow. I\'ve attached the annual plan 1-pager and noted the invoice address for billing. See you then.' }
        ]
      },
      {
        title: 'Acme Corp · Maya',
        messages: [
          { sender: 'user', text: 'Sharing the updated SOW for legal review. Let me know if redlines are acceptable.' }
        ]
      },
      {
        title: 'Aditi Verma',
        messages: [
          { sender: 'user', text: 'Will revert after our team sync. Thanks.' }
        ]
      },
      {
        title: 'Mantis Logistics',
        messages: [
          { sender: 'user', text: 'Voicemail · 38s · transcript ready. Requested freight quote updates.' }
        ]
      },
      {
        title: 'Kabir Mehta',
        messages: [
          { sender: 'user', text: 'Thanks, will think and revert.' }
        ]
      }
    ];

    for (const c of seedData) {
      const conv = await mongoDb.conversation.create({
        data: {
          tenantId,
          userId,
          title: c.title,
        }
      });
      for (const m of c.messages) {
        await mongoDb.message.create({
          data: {
            conversationId: conv.id,
            sender: m.sender,
            text: m.text,
          }
        });
      }
    }

    conversations = await mongoDb.conversation.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  return NextResponse.json(conversations);
});
