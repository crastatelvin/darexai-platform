import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { db } from '@/lib/db';
import { mongoDb } from '@/lib/mongodb';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const POST = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { tenantId, userId } = ctx;
  const body = await req.json().catch(() => ({}));
  const { contactId, messageText } = body;

  if (!contactId || !messageText) {
    return NextResponse.json({ error: 'contactId and messageText are required' }, { status: 400 });
  }

  // Verify contact belongs to this tenant
  const contact = await db.contact.findFirst({
    where: { id: contactId, tenantId },
  });

  if (!contact || !contact.phone) {
    return NextResponse.json({ error: 'Contact not found or missing phone number' }, { status: 404 });
  }

  // 1. Dispatch WhatsApp message (Real or Mock simulation)
  const sendResult = await sendWhatsAppMessage(contact.phone, messageText);

  if (!sendResult.success) {
    return NextResponse.json({ error: sendResult.status }, { status: 500 });
  }

  // 2. Persist manual reply in MongoDB TimelineEvent
  const event = await mongoDb.timelineEvent.create({
    data: {
      tenantId,
      contactId: contact.id,
      type: 'whatsapp',
      direction: 'outbound',
      title: 'Manual Business Response (WhatsApp)',
      body: messageText,
      sentiment: 'neutral',
      intent: 'general',
    },
  });

  // 3. Log Audit trail
  await db.auditLog.create({
    data: {
      action: 'SEND_WHATSAPP_MANUAL',
      details: `Sent manual WhatsApp to ${contact.name}: "${messageText.substring(0, 40)}..."`,
      tenantId,
      userId,
    },
  });

  return NextResponse.json(event);
});
