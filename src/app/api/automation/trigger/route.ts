import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { db } from '@/lib/db';
import { mongoDb } from '@/lib/mongodb';
import Groq from 'groq-sdk';

export const POST = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { tenantId, userId } = ctx;
  const body = await req.json().catch(() => ({}));
  const { name, email, phone, notes } = body;

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
  }

  const executionLogs: string[] = [];
  executionLogs.push(`[1/5] Initiating automation flow for lead: ${name} (${email})`);

  // 1. Create Contact in PostgreSQL
  let contact = await db.contact.findFirst({
    where: { email, tenantId },
  });

  if (!contact) {
    contact = await db.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        status: 'LEAD',
        tenantId,
      },
    });
    executionLogs.push(`Created new lead contact in database. ID: ${contact.id}`);
  } else {
    executionLogs.push(`Found existing lead contact in database. ID: ${contact.id}`);
  }

  // 2. AI Qualification
  executionLogs.push(`[2/5] Running AI Lead Qualification Analysis...`);
  const tenantSettings = await db.tenantSettings.findUnique({
    where: { tenantId },
  });

  const apiKey = tenantSettings?.groqApiKey || process.env.GROQ_API_KEY;
  const isMock = !apiKey || apiKey === 'your-groq-api-key';
  const threshold = tenantSettings?.leadScoreThreshold ?? 80;
  const enableAutoReply = tenantSettings?.autoWhatsappReply ?? true;

  let qualificationScore = 50;
  let qualificationReasoning = '';

  if (isMock) {
    // Mock Qualification logic based on keywords
    const lowerNotes = (notes || '').toLowerCase();
    if (lowerNotes.includes('budget') || lowerNotes.includes('enterprise') || lowerNotes.includes('immediate') || lowerNotes.includes('45k')) {
      qualificationScore = 88;
      qualificationReasoning = 'Lead indicates enterprise scale and immediate timeline with substantial budget.';
    } else if (lowerNotes.includes('student') || lowerNotes.includes('free') || lowerNotes.includes('cheap')) {
      qualificationScore = 32;
      qualificationReasoning = 'Lead is budget-sensitive or educational profile, low commercial fit.';
    } else {
      qualificationScore = 72;
      qualificationReasoning = 'Standard interest profile. Fits mid-market commercial tier.';
    }
    executionLogs.push(`[Mock AI] Assigned qualification score: ${qualificationScore}`);
  } else {
    try {
      const groq = new Groq({ apiKey });
      
      const prompt = `Analyze the following business lead's profile details and assign a qualification score from 0 to 100 representing commercial sales potential.
Provide your response strictly in JSON format. JSON keys: "score" (number), "reasoning" (string).

Lead profile:
Name: ${name}
Email: ${email}
Notes: ${notes || 'No description provided.'}`;

      const chatCompletion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' } // Groq JSON response format enforce
      });
      
      const text = chatCompletion.choices[0].message.content || '{}';
      const parsed = JSON.parse(text);
      
      qualificationScore = parsed.score ?? 50;
      qualificationReasoning = parsed.reasoning || '';
      
      executionLogs.push(`[Groq AI] Assigned qualification score: ${qualificationScore}`);
    } catch (err: any) {
      console.error('AI Qualification error:', err);
      qualificationScore = 60;
      qualificationReasoning = 'Fallback score. AI qualification system unavailable.';
      executionLogs.push(`[AI Error] ${err.message || err}. Reverted to fallback score: 60`);
    }
  }

  executionLogs.push(`Decision Point: Qualification Score is ${qualificationScore}. Threshold is ${threshold}. Auto-reply: ${enableAutoReply ? 'ENABLED' : 'DISABLED'}`);

  let autoWhatsAppSent = false;
  let autoTaskCreated = false;

  // 3. Score > Threshold Actions
  if (qualificationScore > threshold && enableAutoReply) {
    executionLogs.push(`[3/5] Score > ${threshold} and auto-reply enabled: Triggering outreach and follow-up creation.`);

    // A. Send Simulated WhatsApp
    const messageBody = `Hi ${name}! Thanks for reaching out to us. Your inquiry about our services has been pre-qualified for our Accelerated Pilot Program. Let's schedule a kickoff call this week! Book here: calendly.com/darexai/kickoff.`;
    
    await mongoDb.timelineEvent.create({
      data: {
        tenantId,
        contactId: contact.id,
        type: 'whatsapp',
        direction: 'outbound',
        title: 'Automated Lead Qualification Outreach (WhatsApp)',
        body: messageBody,
        sentiment: 'positive',
        intent: 'sales',
      },
    });
    autoWhatsAppSent = true;
    executionLogs.push(`Simulated outbound WhatsApp message logged in contact's MongoDB timeline.`);

    // B. Create Task
    const taskTitle = `Follow up with high-value lead: ${name}`;
    const taskDesc = `Lead score: ${qualificationScore}%\nReasoning: ${qualificationReasoning}\n\nAutomated WhatsApp has been sent. Contact them to lock in a discovery call date.`;
    
    await db.task.create({
      data: {
        title: taskTitle,
        description: taskDesc,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // due tomorrow
        contactId: contact.id,
        tenantId,
        userId,
      },
    });
    autoTaskCreated = true;
    executionLogs.push(`Created CRM follow-up task: "${taskTitle}" (due tomorrow).`);
  } else {
    executionLogs.push(`[3/5] Score <= ${threshold} or auto-reply disabled: Skipped automated outreach. Marked for manual review.`);
  }

  // 4. Record Audit Log in PostgreSQL
  executionLogs.push(`[4/5] Recording audit trail entry.`);
  const auditDetails = `Lead: ${name} (${email}). Score: ${qualificationScore}/100. Actions: [WhatsApp: ${autoWhatsAppSent ? 'SENT' : 'SKIPPED'}, Task: ${autoTaskCreated ? 'CREATED' : 'SKIPPED'}]. Reasoning: ${qualificationReasoning}`;
  
  await db.auditLog.create({
    data: {
      action: 'LEAD_QUALIFICATION_FLOW',
      details: auditDetails,
      tenantId,
      userId,
    },
  });
  executionLogs.push(`Audit log recorded successfully.`);

  executionLogs.push(`[5/5] Lead Qualification Workflow completed successfully.`);

  return NextResponse.json({
    success: true,
    score: qualificationScore,
    reasoning: qualificationReasoning,
    autoWhatsAppSent,
    autoTaskCreated,
    executionLogs,
  });
});
