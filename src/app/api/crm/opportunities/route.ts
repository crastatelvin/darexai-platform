import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { db } from '@/lib/db';

export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const opportunities = await db.opportunity.findMany({
    where: { tenantId: ctx.tenantId },
    include: { contact: true },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(opportunities);
});

export const POST = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const body = await req.json().catch(() => ({}));
  const { title, value, status, contactId } = body;

  if (!title || !value || !contactId) {
    return NextResponse.json({ error: 'Title, value, and contactId are required' }, { status: 400 });
  }

  // Verify contact belongs to same tenant
  const contact = await db.contact.findFirst({
    where: { id: contactId, tenantId: ctx.tenantId },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found or access denied' }, { status: 404 });
  }

  // Default Next Best Action based on stage
  let nextBestAction = 'Perform initial qualification.';
  if (status === 'QUALIFYING') nextBestAction = 'Define business requirements.';
  if (status === 'PROPOSAL') nextBestAction = 'Submit formal quote.';

  const opportunity = await db.opportunity.create({
    data: {
      title,
      value: parseFloat(value),
      status: status || 'NEW',
      contactId,
      tenantId: ctx.tenantId,
      nextBestAction,
    },
  });

  await db.auditLog.create({
    data: {
      action: 'CREATE_OPPORTUNITY',
      details: `Created opportunity "${title}" ($${value})`,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    },
  });

  return NextResponse.json(opportunity);
});

export const PUT = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const body = await req.json().catch(() => ({}));
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
  }

  const opportunity = await db.opportunity.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!opportunity) {
    return NextResponse.json({ error: 'Opportunity not found or access denied' }, { status: 404 });
  }

  let nextBestAction = opportunity.nextBestAction;
  if (status === 'QUALIFYING') nextBestAction = 'Book detailed solution consultation.';
  if (status === 'PROPOSAL') nextBestAction = 'Send detailed cost quote & RFP response.';
  if (status === 'NEGOTIATION') nextBestAction = 'Offer a standard 10% discount on first year contract.';
  if (status === 'WON') nextBestAction = 'Kickstart implementation and team assignment.';
  if (status === 'LOST') nextBestAction = 'Schedule post-mortem feedback call.';

  const updated = await db.opportunity.update({
    where: { id },
    data: { 
      status,
      nextBestAction,
    },
  });

  await db.auditLog.create({
    data: {
      action: 'UPDATE_OPPORTUNITY',
      details: `Updated opportunity "${opportunity.title}" to stage: ${status}`,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    },
  });

  return NextResponse.json(updated);
});
