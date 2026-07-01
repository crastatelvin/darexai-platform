import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { db } from '@/lib/db';

// GET settings for tenant
export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { tenantId } = ctx;

  let settings = await db.tenantSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    // Return empty defaults
    return NextResponse.json({
      groqApiKey: '',
      googleClientId: '',
      googleClientSecret: '',
      leadScoreThreshold: 80,
      autoWhatsappReply: false,
    });
  }

  return NextResponse.json(settings);
});

// POST update settings for tenant
export const POST = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { tenantId, userId } = ctx;
  const body = await req.json().catch(() => ({}));

  const { 
    groqApiKey, 
    googleClientId, 
    googleClientSecret, 
    leadScoreThreshold, 
    autoWhatsappReply 
  } = body;

  const settings = await db.tenantSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      groqApiKey: groqApiKey || null,
      googleClientId: googleClientId || null,
      googleClientSecret: googleClientSecret || null,
      leadScoreThreshold: Number(leadScoreThreshold) || 80,
      autoWhatsappReply: Boolean(autoWhatsappReply),
    },
    update: {
      groqApiKey: groqApiKey || null,
      googleClientId: googleClientId || null,
      googleClientSecret: googleClientSecret || null,
      leadScoreThreshold: Number(leadScoreThreshold) || 80,
      autoWhatsappReply: Boolean(autoWhatsappReply),
    },
  });

  // Record an audit log entry
  await db.auditLog.create({
    data: {
      action: 'UPDATE_SETTINGS',
      details: 'User updated tenant security credentials and thresholds.',
      tenantId,
      userId,
    },
  });

  return NextResponse.json({ success: true, settings });
});
