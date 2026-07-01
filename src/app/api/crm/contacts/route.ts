import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { db } from '@/lib/db';

export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const contacts = await db.contact.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(contacts);
});

export const POST = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const body = await req.json().catch(() => ({}));
  const { name, email, phone, status } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const contact = await db.contact.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      status: status || 'LEAD',
      tenantId: ctx.tenantId,
    },
  });

  await db.auditLog.create({
    data: {
      action: 'CREATE_CONTACT',
      details: `Created contact "${name}" (${status || 'LEAD'})`,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    },
  });

  return NextResponse.json(contact);
});
