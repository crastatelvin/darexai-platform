import { db } from './db';
import { mongoDb } from './mongodb';

export async function seedTenantData(tenantId: string) {
  // Check if we already have seeded contacts
  const existingContacts = await db.contact.findFirst({
    where: { tenantId },
  });

  if (existingContacts) {
    return; // Already seeded
  }

  // 1. Create Contacts
  const contact1 = await db.contact.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice.j@acme.com',
      phone: '+1555019921',
      status: 'LEAD',
      tenantId,
    },
  });

  const contact2 = await db.contact.create({
    data: {
      name: 'Bob Smith',
      email: 'bob.smith@techcorp.com',
      phone: '+1555014829',
      status: 'CONTACT',
      tenantId,
    },
  });

  const contact3 = await db.contact.create({
    data: {
      name: 'Charlie Brown',
      email: 'charlie.b@peanuts.org',
      phone: '+1555018374',
      status: 'CUSTOMER',
      tenantId,
    },
  });

  // 2. Create Opportunities
  const opp1 = await db.opportunity.create({
    data: {
      title: 'Enterprise Software Licensing',
      value: 45000.0,
      status: 'PROPOSAL',
      contactId: contact2.id,
      tenantId,
      nextBestAction: 'Schedule walkthrough of security architecture.',
    },
  });

  const opp2 = await db.opportunity.create({
    data: {
      title: 'AI Consultation & Discovery Workshop',
      value: 12000.0,
      status: 'QUALIFYING',
      contactId: contact1.id,
      tenantId,
      nextBestAction: 'Send qualification survey link.',
    },
  });

  const opp3 = await db.opportunity.create({
    data: {
      title: 'Annual Support Retainer Contract',
      value: 8500.0,
      status: 'NEW',
      contactId: contact3.id,
      tenantId,
      nextBestAction: 'Send standard retainer contract template.',
    },
  });

  // 3. Create Tasks
  await db.task.create({
    data: {
      title: 'Review Acme Corp proposal request',
      description: 'Go through their RFQ doc and draft line item estimates',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      contactId: contact2.id,
      tenantId,
    },
  });

  await db.task.create({
    data: {
      title: 'Follow up with Alice on AI readiness',
      description: 'Discuss the team size, current technology stack, and budget scale.',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      contactId: contact1.id,
      tenantId,
    },
  });

  // 4. Create Unified Inbox Timeline Events in MongoDB
  try {
    const eventsData = [
      {
        tenantId,
        contactId: contact1.id,
        type: 'email',
        direction: 'inbound',
        title: 'Request for AI Integration Consultation',
        body: "Hi Team,\n\nWe are looking to implement generative AI features inside our CRM system. Can we schedule a brief 30-minute discovery call to explore your consultation services?\n\nThanks,\nAlice",
        sentiment: 'positive',
        intent: 'sales',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        tenantId,
        contactId: contact1.id,
        type: 'email',
        direction: 'outbound',
        title: 'Re: Request for AI Integration Consultation',
        body: 'Hello Alice,\n\nThanks for reaching out! We would be delighted to assist. Here is a scheduling link: calendly.com/darexai/discovery.\n\nBest regards,\nDareXAI Team',
        sentiment: 'neutral',
        intent: 'general',
        createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
      },
      {
        tenantId,
        contactId: contact2.id,
        type: 'whatsapp',
        direction: 'inbound',
        title: 'WhatsApp Message from Bob',
        body: 'Hey there, did you get a chance to review the licensing terms we sent yesterday? Let me know if we need a quick call.',
        sentiment: 'neutral',
        intent: 'sales',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        tenantId,
        contactId: contact2.id,
        type: 'call',
        direction: 'outbound',
        title: 'Outbound Call to Bob Smith',
        body: 'Discussed pricing models and support SLA. Bob requested custom SLAs for high-availability setups. Proposal revision requested.',
        sentiment: 'positive',
        intent: 'sales',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        tenantId,
        contactId: contact3.id,
        type: 'whatsapp',
        direction: 'inbound',
        title: 'WhatsApp Message from Charlie',
        body: 'Hello, the invoice was paid this morning. Can you verify if the subscription has been renewed?',
        sentiment: 'positive',
        intent: 'support',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    for (const e of eventsData) {
      await mongoDb.timelineEvent.create({ data: e });
    }
  } catch (mongoError) {
    console.error('Failed to seed MongoDB timeline logs:', mongoError);
  }
}
