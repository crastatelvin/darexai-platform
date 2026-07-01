import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { mongoDb } from '@/lib/mongodb';
import { db } from '@/lib/db';

export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get('contactId');

  const filter: any = { tenantId: ctx.tenantId };
  if (contactId) {
    filter.contactId = contactId;
  }

  // Fetch events from MongoDB
  const events = await mongoDb.timelineEvent.findMany({
    where: filter,
    orderBy: { createdAt: 'desc' },
  });

  // Hydrate contact names from PostgreSQL for convenience
  const contactIds = Array.from(new Set(events.map(e => e.contactId)));
  const contacts = await db.contact.findMany({
    where: {
      id: { in: contactIds },
      tenantId: ctx.tenantId,
    },
    select: { id: true, name: true, email: true },
  });

  const contactMap = new Map(contacts.map(c => [c.id, c]));

  const hydratedEvents = events.map(event => ({
    ...event,
    contact: contactMap.get(event.contactId) || { name: 'Unknown Contact', email: '' },
  }));

  return NextResponse.json(hydratedEvents);
});

// Allow creating mock timeline events (useful for simulations)
export const POST = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const body = await req.json().catch(() => ({}));
  const { contactId, type, direction, title, body: textBody, sentiment, intent } = body;

  if (!contactId || !type || !direction || !title || !textBody) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Check if contact exists
  const contact = await db.contact.findFirst({
    where: { id: contactId, tenantId: ctx.tenantId },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  const event = await mongoDb.timelineEvent.create({
    data: {
      tenantId: ctx.tenantId,
      contactId,
      type,
      direction,
      title,
      body: textBody,
      sentiment: sentiment || 'neutral',
      intent: intent || 'general',
    },
  });

  return NextResponse.json(event);
});
