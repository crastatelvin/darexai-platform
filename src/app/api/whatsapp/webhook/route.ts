import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mongoDb } from '@/lib/mongodb';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import Groq from 'groq-sdk';

// GET: Webhook verification from Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'darexai-whatsapp-token-secret-123';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WhatsApp webhook verified successfully.');
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST: Incoming webhook messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    let from = '';
    let senderName = '';
    let messageText = '';
    let isSimulation = false;

    // 1. Parse payload: Support both Meta Cloud payload structure and local mock simulation payload
    if (body.simulation) {
      isSimulation = true;
      from = body.from || '1555019921';
      senderName = body.name || 'Mock WhatsApp Client';
      messageText = body.text || 'Hello, I want to buy your enterprise software license.';
    } else {
      // Standard Meta Cloud API Payload structure
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const val = change?.value;
      const msg = val?.messages?.[0];
      const contact = val?.contacts?.[0];

      if (!msg) {
        // Return 200 to Meta acknowledging delivery of non-message webhook events (statuses, read-receipts)
        return new Response('EVENT_RECEIVED', { status: 200 });
      }

      from = msg.from; // Sender phone number
      senderName = contact?.profile?.name || 'WhatsApp Client';
      messageText = msg.text?.body || '';
    }

    if (!from || !messageText) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Strip non-digits from phone number
    const cleanFrom = from.replace(/\D/g, '');

    // 2. Identify Contact & Tenant Isolation Scope
    // Check globally in PostgreSQL if phone contains sender digits
    let dbContact = await db.contact.findFirst({
      where: {
        phone: { contains: cleanFrom },
      },
    });

    let tenantId = '';
    if (dbContact) {
      tenantId = dbContact.tenantId;
    } else {
      // Auto-onboard contact to default system workspace
      const defaultTenant = await db.tenant.findFirst();
      if (!defaultTenant) {
        return NextResponse.json({ error: 'No active tenant workspace found' }, { status: 500 });
      }
      tenantId = defaultTenant.id;

      dbContact = await db.contact.create({
        data: {
          name: senderName,
          phone: `+${cleanFrom}`,
          status: 'LEAD',
          tenantId,
        },
      });
      console.log(`Auto-created lead contact for new WhatsApp sender: ${senderName} (+${cleanFrom})`);
    }

    // 3. AI Sentiment, Intent & Summary Detection
    let sentiment = 'neutral';
    let intent = 'general';
    let summaryText = messageText;

    const apiKey = process.env.GROQ_API_KEY;
    const isAiMock = !apiKey || apiKey === 'your-groq-api-key';

    if (!isAiMock) {
      try {
        const groq = new Groq({ apiKey });
        const analysisPrompt = `Analyze this customer WhatsApp message: "${messageText}".
Classify its sentiment as "positive", "neutral", or "negative".
Classify its intent as "sales", "support", "complaint", or "general".
Provide a brief 1-sentence summary of the request.
Provide your response strictly in JSON format. JSON keys: "sentiment" (string), "intent" (string), "summary" (string).`;

        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: analysisPrompt }],
          response_format: { type: 'json_object' }
        });

        const text = completion.choices[0].message.content || '{}';
        const parsed = JSON.parse(text);
        sentiment = parsed.sentiment || 'neutral';
        intent = parsed.intent || 'general';
        summaryText = parsed.summary || messageText;
      } catch (err) {
        console.error('Failed to run AI classification on WhatsApp message:', err);
      }
    } else {
      // Simple Mock classification
      const lower = messageText.toLowerCase();
      if (lower.includes('invoice') || lower.includes('pay') || lower.includes('renew')) {
        intent = 'support';
        sentiment = 'positive';
      } else if (lower.includes('buy') || lower.includes('pricing') || lower.includes('enterprise')) {
        intent = 'sales';
        sentiment = 'positive';
      } else if (lower.includes('broke') || lower.includes('fail') || lower.includes('error')) {
        intent = 'complaint';
        sentiment = 'negative';
      }
    }

    // 4. Save Inbound Message in MongoDB Timeline Logs
    await mongoDb.timelineEvent.create({
      data: {
        tenantId,
        contactId: dbContact.id,
        type: 'whatsapp',
        direction: 'inbound',
        title: `WhatsApp Inbound from ${senderName}`,
        body: messageText,
        sentiment,
        intent,
      },
    });

    // 5. Automated AI Reply Generation
    let autoReplyText = '';
    const shouldAutoReply = process.env.WHATSAPP_AUTO_REPLY === 'true';

    if (shouldAutoReply) {
      if (isAiMock) {
        autoReplyText = `Hi ${senderName}, thanks for messaging DareXAI! We received your WhatsApp about: "${summaryText.substring(0, 40)}...". One of our representatives will contact you shortly.`;
      } else {
        try {
          const groq = new Groq({ apiKey });
          const replyPrompt = `You are the automated AI Business Agent for DareXAI operations portal.
Answer this WhatsApp message from customer ${senderName}: "${messageText}".
Reply in a professional, polite tone. Keep the answer extremely brief (under 150 characters) so it fits in a SMS/WhatsApp notification.`;

          const replyCompletion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: replyPrompt }],
          });

          autoReplyText = replyCompletion.choices[0].message.content || '';
        } catch (err) {
          console.error('Failed to generate AI auto-reply:', err);
          autoReplyText = `Hi ${senderName}, we received your message and are processing it. Thanks for reaching out!`;
        }
      }

      // Dispatch simulated or real WhatsApp message
      const sendResult = await sendWhatsAppMessage(cleanFrom, autoReplyText);

      if (sendResult.success) {
        // Save Outbound Reply in MongoDB Timeline Logs
        await mongoDb.timelineEvent.create({
          data: {
            tenantId,
            contactId: dbContact.id,
            type: 'whatsapp',
            direction: 'outbound',
            title: 'Automated AI Response (WhatsApp)',
            body: autoReplyText,
            sentiment: 'neutral',
            intent: 'general',
          },
        });
      }
    }

    return new Response(isSimulation ? JSON.stringify({ success: true, autoReplied: shouldAutoReply, reply: autoReplyText }) : 'EVENT_RECEIVED', {
      status: 200,
      headers: isSimulation ? { 'Content-Type': 'application/json' } : {},
    });

  } catch (error: any) {
    console.error('WhatsApp Webhook crash:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
