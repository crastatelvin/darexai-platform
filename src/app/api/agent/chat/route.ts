import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ProtectedRouteContext } from '@/lib/protected-route';
import { db } from '@/lib/db';
import { mongoDb } from '@/lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Declare Gemini tools
const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'search_contacts',
        description: 'Search for customer contacts in this tenant by name or email.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Name or email keyword' },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_task',
        description: 'Create a reminder or follow-up task for a user and contact.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Title of the task' },
            description: { type: 'STRING', description: 'Detailed description' },
            dueDateDaysFromNow: { type: 'NUMBER', description: 'Days from now the task is due' },
            contactName: { type: 'STRING', description: 'Name of the contact this task is associated with' },
          },
          required: ['title'],
        },
      },
      {
        name: 'update_opportunity',
        description: 'Update the status or pipeline stage of an existing opportunity.',
        parameters: {
          type: 'OBJECT',
          properties: {
            opportunityTitle: { type: 'STRING', description: 'Title of the opportunity to update' },
            status: { 
              type: 'STRING', 
              description: 'New status stage',
              enum: ['NEW', 'QUALIFYING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
            },
          },
          required: ['opportunityTitle', 'status'],
        },
      },
      {
        name: 'send_whatsapp',
        description: 'Send a simulated WhatsApp message to a customer.',
        parameters: {
          type: 'OBJECT',
          properties: {
            contactName: { type: 'STRING', description: 'Name of the contact' },
            messageText: { type: 'STRING', description: 'The text content to send' },
          },
          required: ['contactName', 'messageText'],
        },
      },
      {
        name: 'fetch_business_metrics',
        description: 'Fetch aggregate live CRM KPIs (Opportunities count, Revenue Pipeline, pending tasks).',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },
];

// Helper to execute agent tools
async function executeTool(name: string, args: any, ctx: ProtectedRouteContext) {
  const { tenantId, userId } = ctx;

  switch (name) {
    case 'search_contacts': {
      const { query } = args;
      const contacts = await db.contact.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });
      return { success: true, count: contacts.length, contacts };
    }

    case 'create_task': {
      const { title, description, dueDateDaysFromNow, contactName } = args;
      
      let contactId: string | undefined;
      if (contactName) {
        const contact = await db.contact.findFirst({
          where: { tenantId, name: { contains: contactName, mode: 'insensitive' } },
        });
        if (contact) contactId = contact.id;
      }

      const dueDate = dueDateDaysFromNow 
        ? new Date(Date.now() + dueDateDaysFromNow * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day default

      const task = await db.task.create({
        data: {
          title,
          description: description || '',
          dueDate,
          tenantId,
          contactId,
          userId,
        },
      });

      await db.auditLog.create({
        data: {
          action: 'CREATE_TASK_AI',
          details: `AI created task: "${title}" (Due: ${dueDate.toLocaleDateString()})`,
          tenantId,
          userId,
        },
      });

      return { success: true, taskId: task.id, title: task.title, dueDate: task.dueDate };
    }

    case 'update_opportunity': {
      const { opportunityTitle, status } = args;
      
      const opportunity = await db.opportunity.findFirst({
        where: { tenantId, title: { contains: opportunityTitle, mode: 'insensitive' } },
      });

      if (!opportunity) {
        return { success: false, error: `Opportunity matching "${opportunityTitle}" not found.` };
      }

      // Generate a simple next best action suggestion based on new status
      let nextBestAction = 'Follow up with customer.';
      if (status === 'QUALIFYING') nextBestAction = 'Schedule deep-dive discovery call.';
      if (status === 'PROPOSAL') nextBestAction = 'Present line-item estimate and request feedback.';
      if (status === 'NEGOTIATION') nextBestAction = 'Offer standard pricing discount or customize terms.';
      if (status === 'WON') nextBestAction = 'Initiate onboarding and provision services.';

      const updated = await db.opportunity.update({
        where: { id: opportunity.id },
        data: { status, nextBestAction },
      });

      await db.auditLog.create({
        data: {
          action: 'UPDATE_OPPORTUNITY_AI',
          details: `AI updated opportunity "${opportunity.title}" stage to ${status}`,
          tenantId,
          userId,
        },
      });

      return { success: true, opportunityId: updated.id, title: updated.title, newStatus: updated.status, nextBestAction };
    }

    case 'send_whatsapp': {
      const { contactName, messageText } = args;

      const contact = await db.contact.findFirst({
        where: { tenantId, name: { contains: contactName, mode: 'insensitive' } },
      });

      if (!contact) {
        return { success: false, error: `Contact "${contactName}" not found.` };
      }

      // Log in MongoDB Timeline Event
      await mongoDb.timelineEvent.create({
        data: {
          tenantId,
          contactId: contact.id,
          type: 'whatsapp',
          direction: 'outbound',
          title: 'WhatsApp Message sent by AI',
          body: messageText,
          sentiment: 'neutral',
          intent: 'sales',
        },
      });

      await db.auditLog.create({
        data: {
          action: 'SEND_WHATSAPP_AI',
          details: `AI simulated WhatsApp sent to ${contact.name}: "${messageText.substring(0, 40)}..."`,
          tenantId,
          userId,
        },
      });

      return { success: true, recipient: contact.name, status: 'Sent (Mocked)' };
    }

    case 'fetch_business_metrics': {
      const opps = await db.opportunity.findMany({ where: { tenantId } });
      const activeOpps = opps.filter(o => o.status !== 'WON' && o.status !== 'LOST');
      const pipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0);
      const pendingTasksCount = await db.task.count({ where: { tenantId, status: 'PENDING' } });

      return {
        success: true,
        activeOpportunitiesCount: activeOpps.length,
        totalPipelineValue: pipelineValue,
        pendingTasksCount,
      };
    }

    default:
      return { success: false, error: 'Unknown tool.' };
  }
}

// Post Handler wrapper with authentication
export const POST = withAuth(async (req: NextRequest, ctx: ProtectedRouteContext) => {
  const { tenantId, userId } = ctx;
  const body = await req.json().catch(() => ({}));
  const { message, conversationId } = body;

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  // Find or create Conversation in MongoDB
  let conversation;
  if (conversationId) {
    conversation = await mongoDb.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
  }

  if (!conversation) {
    conversation = await mongoDb.conversation.create({
      data: {
        tenantId,
        userId,
        title: message.substring(0, 30) || 'New Chat',
      },
    });
  }

  // Save user's message in MongoDB
  await mongoDb.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'user',
      text: message,
    },
  });

  // Get historical messages from MongoDB (last 15)
  const historyMessages = await mongoDb.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 15,
  });

  const apiKey = process.env.GEMINI_API_KEY;
  const isMock = !apiKey || apiKey === 'your-gemini-api-key';

  const encoder = new TextEncoder();

  // Create stream
  const stream = new ReadableStream({
    async start(controller) {
      // Send conversation ID first in the stream metadata
      controller.enqueue(encoder.encode(JSON.stringify({ type: 'meta', conversationId: conversation.id }) + '\n'));

      if (isMock) {
        // MOCK AI IMPLEMENTATION (Fallback)
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: '*[Running in Mock Mode - No Gemini API Key]*\n\n' }) + '\n'));
        
        const lowerMsg = message.toLowerCase();
        let replyText = '';

        if (lowerMsg.includes('contact') || lowerMsg.includes('search')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: 'Executing contact search...\n' }) + '\n'));
          const result = await executeTool('search_contacts', { query: 'Alice' }, ctx);
          replyText = `I ran a contact search. Found ${result.count} contacts. Example: Alice Johnson (alice.j@acme.com). Let me know if you want to create a task for them!`;
        } else if (lowerMsg.includes('task') || lowerMsg.includes('remind')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: 'Creating task in database...\n' }) + '\n'));
          const result = await executeTool('create_task', { title: 'Follow up from mock chat', description: 'Created via Mock AI agent fallback', dueDateDaysFromNow: 2, contactName: 'Alice Johnson' }, ctx);
          replyText = `I have successfully created the task: "${result.title}" (Due date: ${new Date(result.dueDate).toLocaleDateString()}).`;
        } else if (lowerMsg.includes('metrics') || lowerMsg.includes('pipeline') || lowerMsg.includes('dashboard')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: 'Calculating CRM metrics...\n' }) + '\n'));
          const result = await executeTool('fetch_business_metrics', {}, ctx);
          replyText = `Here is your current pipeline: Active Opportunities: ${result.activeOpportunitiesCount}, Total Value: $${result.totalPipelineValue.toLocaleString()}, Pending Tasks: ${result.pendingTasksCount}.`;
        } else if (lowerMsg.includes('whatsapp') || lowerMsg.includes('send message')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: 'Simulating WhatsApp sending...\n' }) + '\n'));
          const result = await executeTool('send_whatsapp', { contactName: 'Alice Johnson', messageText: 'Hello Alice, following up on our call.' }, ctx);
          replyText = `WhatsApp message simulation triggered for Alice Johnson. Event recorded in CRM timeline logs.`;
        } else if (lowerMsg.includes('opportunity') || lowerMsg.includes('stage')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: 'Updating CRM pipeline opportunity...\n' }) + '\n'));
          const result = await executeTool('update_opportunity', { opportunityTitle: 'AI Consultation', status: 'PROPOSAL' }, ctx);
          replyText = `I've updated the opportunity stage to PROPOSAL. Next recommended action: "${result.nextBestAction}".`;
        } else {
          replyText = `Hello! I am your AI Business Agent. You can ask me to search contacts, create tasks, update CRM opportunities, fetch business metrics, or send WhatsApp messages. Since you haven't configured a Gemini API Key yet, I am running in Mock Mode, but I can still execute database actions!`;
        }

        // Stream simulated output chunk by chunk
        const words = replyText.split(' ');
        for (const word of words) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: word + ' ' }) + '\n'));
          await new Promise((resolve) => setTimeout(resolve, 30));
        }

        // Save assistant's reply in MongoDB
        await mongoDb.message.create({
          data: {
            conversationId: conversation.id,
            sender: 'assistant',
            text: replyText,
          },
        });

      } else {
        // REAL GEMINI API INTEGRATION
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: 'You are DareXAI, an active AI Business Assistant for a business operations portal. You assist the business owner by using the provided tools to search contacts, update CRM pipelines, schedule follow-up tasks, trigger WhatsApp communications, and display aggregate database metrics. Keep replies concise and action-oriented. Be professional.',
          });

          // Format chat history for Gemini (excluding the last user message just created)
          const geminiHistory = historyMessages
            .slice(0, -1)
            .map((msg) => ({
              role: msg.sender === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.text }],
            }));

          const chat = model.startChat({
            history: geminiHistory,
            generationConfig: { maxOutputTokens: 1000 },
          });

          // Send message with tools
          const result = await chat.sendMessage(message, {
            tools: GEMINI_TOOLS,
          });

          const response = result.response;
          const calls = response.functionCalls();

          let finalReplyText = '';

          if (calls && calls.length > 0) {
            // Process the first tool call
            const call = calls[0];
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'tool', toolName: call.name, args: call.args }) + '\n'));
            
            // Execute tool action
            const toolResult = await executeTool(call.name, call.args, ctx);

            // Send tool result back to Gemini
            const followUpResult = await chat.sendMessage([
              {
                functionResponse: {
                  name: call.name,
                  response: toolResult,
                },
              },
            ]);

            // Stream follow-up text response
            const responseText = followUpResult.response.text();
            finalReplyText = responseText;
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: responseText }) + '\n'));
          } else {
            // No tool calling, stream text directly
            // Note: Since we used sendMessage, we get full response. We can stream it locally.
            const responseText = response.text();
            finalReplyText = responseText;
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: responseText }) + '\n'));
          }

          // Save assistant's reply in MongoDB
          await mongoDb.message.create({
            data: {
              conversationId: conversation.id,
              sender: 'assistant',
              text: finalReplyText,
            },
          });

        } catch (geminiError: any) {
          console.error('Gemini API Error:', geminiError);
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: `Error contacting Gemini API: ${geminiError.message || geminiError}. Falling back to text.` }) + '\n'));
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
});
