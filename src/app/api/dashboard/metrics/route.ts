import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { db } from '@/lib/db';
import { mongoDb } from '@/lib/mongodb';

export const GET = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { tenantId } = ctx;

  // 1. Opportunities & Pipeline
  const opportunities = await db.opportunity.findMany({
    where: { tenantId },
    include: { contact: true },
  });

  const activeOpps = opportunities.filter(o => o.status !== 'WON' && o.status !== 'LOST');
  const wonOpps = opportunities.filter(o => o.status === 'WON');
  
  const pipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0);
  const closedRevenue = wonOpps.reduce((sum, o) => sum + o.value, 0);

  // 2. Pending Tasks
  const pendingTasksCount = await db.task.count({
    where: { tenantId, status: 'PENDING' },
  });

  // 3. Customer Activity timeline events
  const timelineEvents = await mongoDb.timelineEvent.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Hydrate contact names for recent activity
  const contactIds = Array.from(new Set(timelineEvents.map(e => e.contactId)));
  const contacts = await db.contact.findMany({
    where: { id: { in: contactIds }, tenantId },
    select: { id: true, name: true },
  });
  const contactMap = new Map(contacts.map(c => [c.id, c.name]));

  const activities = timelineEvents.map(e => ({
    id: e.id,
    type: e.type,
    direction: e.direction,
    title: e.title,
    body: e.body,
    contactName: contactMap.get(e.contactId) || 'Unknown Customer',
    createdAt: e.createdAt,
  }));

  // 4. Audit Trail logs
  const auditLogs = await db.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // 5. Dynamic AI Alerts (AI Alerts)
  const aiAlerts = [];
  
  // Alert for high qualification score lead
  const qualificationAudit = auditLogs.find(log => log.action === 'LEAD_QUALIFICATION_FLOW');
  if (qualificationAudit && qualificationAudit.details) {
    // Parse score from details
    const scoreMatch = qualificationAudit.details.match(/Score:\s*(\d+)/);
    if (scoreMatch && parseInt(scoreMatch[1]) > 80) {
      aiAlerts.push({
        type: 'success',
        message: `High-value lead qualified! Score: ${scoreMatch[1]}/100. Automated WhatsApp sent.`,
      });
    }
  }

  // Alert for opportunities with next action recommendation
  const negOpps = activeOpps.filter(o => o.status === 'NEGOTIATION');
  if (negOpps.length > 0) {
    aiAlerts.push({
      type: 'warning',
      message: `${negOpps.length} opportunities in Negotiation stage. Next best action: review pricing/discount terms.`,
    });
  }

  // Alert if pending tasks are overdue
  const overdueTasks = await db.task.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      dueDate: { lt: new Date() },
    },
  });
  if (overdueTasks.length > 0) {
    aiAlerts.push({
      type: 'danger',
      message: `${overdueTasks.length} pending tasks are overdue! Please update status or reschedule.`,
    });
  }

  // Default alert if nothing else
  if (aiAlerts.length === 0) {
    aiAlerts.push({
      type: 'info',
      message: 'AI Model review: All active leads qualified and pipeline SLA within normal limits.',
    });
  }

  return NextResponse.json({
    kpis: {
      activeOpportunitiesCount: activeOpps.length,
      revenuePipeline: pipelineValue,
      closedRevenue,
      pendingTasksCount,
    },
    activities,
    auditLogs: auditLogs.map(l => ({
      id: l.id,
      action: l.action,
      details: l.details,
      createdAt: l.createdAt,
    })),
    aiAlerts,
  });
});
