# 🎙️ DareXAI: Technical Deep-Dive & NotebookLM Video Guide

This document is a comprehensive technical reference for the **DareXAI Autonomous Agentic Operations (Ops) CRM & Customer Communications Platform**. It is structured to serve as a complete knowledge base for NotebookLM, AI video/audio generation tools, or developer walkthroughs, mapping out the architecture, codebase, security features, and agentic workflows from A to Z.

---

## 📋 Table of Contents
1. [Core Architecture & Hybrid Database Strategy](#1-core-architecture--hybrid-database-strategy)
2. [Secure JWT Auth & Google OAuth PKCE Security Protocol](#2-secure-jwt-auth--google-oauth-pkce-security-protocol)
3. [Agentic Operations: Dynamic Tool-Calling Core](#3-agentic-operations-dynamic-tool-calling-core)
4. [Production-Ready WhatsApp Meta Cloud Integration](#4-production-ready-whatsapp-meta-cloud-integration)
5. [Automated Lead Qualification & Workflow Orchestration](#5-automated-lead-qualification--workflow-orchestration)
6. [Interactive Kanban Board & State Synchronization](#6-interactive-kanban-board--state-synchronization)
7. [Local Sandbox, Seeding Engine, and Hardened Test Runner](#7-local-sandbox-seeding-engine-and-hardened-test-runner)

---

## 1. Core Architecture & Hybrid Database Strategy

DareXAI uses a **dual-database hybrid architecture** specifically designed to optimize transactional integrity and document performance:

```
                  ┌──────────────────────────────┐
                  │      Next.js App Router      │
                  └──────────────┬───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌──────────────────┐            ┌──────────────────┐
       │   PostgreSQL     │            │     MongoDB      │
       │ (ACID Relational)│            │ (Document Logs)  │
       └────────┬─────────┘            └────────┬─────────┘
                │                               │
       ┌────────┴─────────┐            ┌────────┴─────────┐
       │ Tenants, Users,  │            │ Chat History,    │
       │ Contacts, Deals, │            │ Webhook Traces,  │
       │ Tasks, Audits    │            │ Inbox Timelines  │
       └──────────────────┘            └──────────────────┘
```

### Why PostgreSQL?
- ** ACID Compliance**: Relational database integrity is vital for transactional CRM structures (deals, tenant-to-user mappings, contacts).
- **Schema Control**: Enforces strict relationships between `Tenant`, `User`, `Contact`, `Opportunity`, and `Task` models via foreign key constraints.
- **ORM Scoping**: Configured with Prisma Client to enable strict tenant filters on queries.

### Why MongoDB?
- **High-Velocity Streams**: Communication logs (WhatsApp packets, webhooks, system traces) are document-centric, variable in structure, and require high-throughput inserts.
- **Time-Series Flexibility**: Timelines can easily store message contents with custom attributes (sentiment, intent, token usage counts) without migrations.
- **Replica-Set Requirements**: Ran inside a local Docker container initialized as a single-node replica set (`rs0`) to support database transactions within Next.js api routes.

### Schema Blueprint (`prisma/schema.prisma` vs `prisma/mongodb.prisma`)
- **`Tenant`**: Root node of database isolation. All data maps back to a unique `tenantId`.
- **`User`**: Accounts mapped to a `role` (`OWNER`, `MEMBER`) and associated with a tenant.
- **`Contact`**: CRM Lead info linked to a `tenantId`.
- **`Opportunity`**: Tracks sales pipelines (`stage` enum, values, owner, AI recommended actions).
- **`AuditLog`**: Security audits tracking critical tenant onboarding and admin operations.
- **`ChatMessage` (MongoDB)**: Represents chat threads across communication paths (WhatsApp threads, AI Agent logs).

---

## 2. Secure JWT Auth & Google OAuth PKCE Security Protocol

Authentication is built from scratch without external third-party identity management wrappers (e.g., Auth0, Clerk), utilizing cookie-based authorization, token rotations, and PKCE verifications.

### OAuth 2.0 PKCE Flow (Proof Key for Code Exchange)
To eliminate authorization code interception attacks during client transitions:

1. **Authentication Request (`src/app/api/auth/google/login/route.ts`)**:
   - Generates a cryptographically secure random `code_verifier`.
   - Computes a `code_challenge` by hashing the verifier with SHA-256 and encoding it as Base64URL.
   - Generates a secure random `state` token to prevent CSRF.
   - Stores the `code_verifier` and `state` inside signed, HttpOnly cookies.
   - Redirects the browser to Google's OAuth endpoint sending the `code_challenge` and `state`.

2. **OAuth Callback (`src/app/api/auth/google/callback/route.ts`)**:
   - Extracts the callback `code` and `state` parameter.
   - Validates the incoming `state` against the stored state cookie.
   - Retrieves the `code_verifier` from the secure cookie.
   - Sends the raw authorization `code` along with the decrypted `code_verifier` directly to Google Token API.
   - Google compares the verifier with the previously registered challenge; tokens are exchanged only upon a match.

### JWT Cryptography & Security Model (`src/lib/auth.ts`)
- **Access Tokens**: Short-lived (15 minutes), signed using HMAC-SHA256, carrying user scopes (`userId`, `tenantId`, `role`).
- **Refresh Tokens**: Long-lived (7 days), stored in the database (`RefreshToken` schema) and rotated upon use to detect replay attacks.
- **Cookies**: Both tokens are dispatched to the browser using:
  - `httpOnly: true`: Blocks cross-site scripting (XSS) document cookie access.
  - `secure: true` (in production): Forces HTTPS transport.
  - `sameSite: 'lax'`: Prevents cross-site request forgery (CSRF).

### Tenant-Isolated Middleware Scoping (`src/lib/protected-route.ts`)
For secure tenant separation, every endpoint extracts the authorization header or cookie, decrypts the JWT access token, and appends `tenantId` to the request context:
```typescript
// Example from src/lib/protected-route.ts
export async function extractTenantContext(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  if (!token) throw new Error('Unauthenticated');
  const payload = verifyAccessToken(token); // Yields { userId, tenantId }
  return payload;
}
```
All queries execute with `where: { tenantId }` filters to guarantee cryptographic tenant boundary isolation.

---

## 3. Agentic Operations: Dynamic Tool-Calling Core

The **AI Business Agent** page (`src/app/dashboard/agent`) uses a dynamic tool-calling architecture. Rather than executing hardcoded rules, the agent analyzes natural language prompts and decides which database procedures to call using Groq's model.

```
                   ┌────────────────────────┐
                   │   User Chat Interface  │
                   └───────────┬────────────┘
                               │ Prompt
                               ▼
                   ┌────────────────────────┐
                   │    Groq AI Engine      │
                   │ (llama-3.3-70b-versat.)│
                   └───────────┬────────────┘
                               │
               ┌───────────────┼───────────────────┐
               ▼ Tool Call     ▼ Tool Call         ▼ Tool Call
          ┌──────────┐   ┌─────────────┐     ┌─────────────┐
          │  search_ │   │ create_task │     │   update_   │
          │ contacts │   │             │     │ opportunity │
          └──────────┘   └─────────────┘     └─────────────┘
```

### The Tool-Registry Layout (`src/app/api/agent/chat/route.ts`)
The server registers specific tools passed to the Groq API:
1. **`search_contacts`**:
   - *Arguments*: `query` (string)
   - *Behavior*: Hits PostgreSQL to find leads matching the search text within the tenant.
2. **`create_task`**:
   - *Arguments*: `title` (string), `contactId` (string), `dueDate` (string)
   - *Behavior*: Creates a task inside PostgreSQL, linking it to the specified contact.
3. **`update_opportunity`**:
   - *Arguments*: `id` (string), `stage` (string), `value` (number)
   - *Behavior*: Performs transactional stage transitions for a deal, executing recalculations of pipeline metrics.
4. **`send_whatsapp`**:
   - *Arguments*: `phone` (string), `message` (string)
   - *Behavior*: Dispatches outbound WhatsApp payloads via Meta Cloud API or triggers local simulation fallback logs.
5. **`fetch_business_metrics`**:
   - *Arguments*: None
   - *Behavior*: Aggregates pipeline values and task completion percentages across the active tenant.

### The Autonomous Streaming Execution Loop
- The engine processes incoming inputs, formats history logs, and runs the LLM tool-evaluation loop.
- If the LLM generates a tool call, the Next.js server intercepts it, executes the local database transaction, passes the resulting records back to the LLM as a tool response context, and requests a final user-facing streaming summary.
- **Fail-Safe Mode**: If the user lacks a `GROQ_API_KEY`, the agent automatically maps intent strings using regex parsing and mocks the responses, executing actual database tool calls in the background.

---

## 4. Production-Ready WhatsApp Meta Cloud Integration

The WhatsApp CRM module (`src/app/dashboard/whatsapp`) integrates Meta's Cloud API with a local developer simulation layer.

### Webhook Verification Handshake (`src/app/api/whatsapp/webhook/route.ts`)
Meta requires a one-time GET verification step:
- The endpoint inspects `hub.mode`, `hub.verify_token`, and `hub.challenge`.
- Checks if the token matches `WHATSAPP_VERIFY_TOKEN`.
- Responds with the `hub.challenge` string verbatim with a status of `200 OK` to authorize subscription.

### Message Processing Pipeline
When a user sends an inbound WhatsApp message, the webhook handles it:

```
[Inbound Webhook Message]
           │
           ▼
[Signature validation & Token Checks]
           │
           ▼
[Persist message object to MongoDB ChatMessage]
           │
           ▼
[Trigger AI Analysis]
   ├─ Sentiment check: Positive, Neutral, Negative
   └─ Intent classifier: Sales, Support, General
           │
           ▼
[Construct context & execute Auto-Reply generator]
           │
           ▼
[Dispatch outbound reply via Meta Cloud API / Simulate log]
           │
           ▼
[Persist outbound reply to MongoDB ChatMessage]
```

### Sandbox Simulation Engine
For offline developer sandboxing:
- The WhatsApp page contains a **Simulate Webhook Message** form.
- Submitting the form shoots a mock JSON payload structured exactly like Meta's Webhook payload to `/api/whatsapp/webhook`.
- The webhook routes it through the complete production logic, executing AI analysis, database logging, auto-reply generation, and dispatching.
- The UI features a real-time **Webhook Trace Console** showing raw logs, intent evaluation steps, and JSON payloads.

---

## 5. Automated Lead Qualification & Workflow Orchestration

Lead qualification is automated through structured operations (`src/app/api/automation/trigger/route.ts`):

1. **Lead Capture**:
   - A business receives a contact submission (e.g. name, email, company, budget, timeline, project description).
2. **AI Evaluation (JSON Mode)**:
   - The payload is packaged and passed to Groq utilizing the model in `JSON` output mode to enforce schema validation.
   - Evaluates:
     - `qualificationScore` (0 to 100).
     - `fitCategory` (`HIGH`, `MEDIUM`, `LOW`).
     - `summaryReasoning` (explaining decision).
3. **Execution Operations Matrix**:
   - **High-Fit Leads (Score >= 70)**:
     - Promotes the contact to an **Opportunity** on the CRM Kanban board.
     - Dispatches a WhatsApp notification to the lead welcoming them.
     - Creates a high-priority follow-up Task for the workspace owner.
   - **Medium-Fit Leads (Score 40-69)**:
     - Flags the contact in the database and assigns a soft-outreach email task.
   - **Low-Fit Leads (Score < 40)**:
     - Archives the contact as unqualified and tags them with automation reasons.

---

## 6. Interactive Kanban Board & State Synchronization

The Kanban pipeline (`src/app/dashboard/crm`) is built as a state-synchronized client interface:

- **Optimistic UI Updates**: Opportunity stage changes are immediate on the client side, synchronizing to the PostgreSQL database in the background.
- **AI Next Best Actions**: Each opportunity card features an AI-evaluated status. When opportunities are dragged to a new stage, the database triggers background logic computing next best actions based on transaction value, timeline, and history context.
- **SessionStorage Lock**: Keeps active conversation IDs cached inside `sessionStorage`. This prevents loss of thread focus when navigating between the Sidebar, CRM pipeline, and Inbox views.

---

## 7. Local Sandbox, Seeding Engine, and Hardened Test Runner

### Local Development Containers
Defined inside `docker-compose.yml`:
- **PostgreSQL Container**: Runs on port `5432` with mapped volumes for persistent testing.
- **MongoDB replicaSet (`rs0`)**: Initiated via a setup script that runs `rs.initiate()` inside the container, satisfying Prisma transaction requirements.

### Database Hydration Engine (`src/lib/seed.ts`)
Crucial for sandbox developer testing:
- Running Mock Login automatically provisions a clean tenant workspace.
- Hydrates the tenant with:
  - 4 Opportunities across different stages on the Kanban Board.
  - 6 Contacts with emails and active phone numbers.
  - Historical chat timelines in MongoDB (simulating a week of communications).
  - Background task lists linked to leads.

### Custom Test Runner (`tests/run.ts`)
A custom TypeScript test runner checks critical operations without relying on heavy framework test packages:
- Verifies JWT signing strength and header tamper prevention.
- Validates the PKCE code challenge cryptographic math.
- Checks tenant extraction middleware.
- Tests WhatsApp webhook verification logic.
- Run via `npm test`.

---

## 🎙️ NotebookLM Podcast Script/Video Framing Ideas

If you load this document into NotebookLM to generate an audio deep-dive, here are the key talking points for the hosts to cover:
1. **The "Why" Behind Hybrid Databases**: Emphasize how traditional startups face issues scaling document-based chats alongside ACID transaction-heavy CRM accounts. Explain why PostgreSQL + MongoDB is the perfect match.
2. **PKCE Authentication from Scratch**: Discuss how modern authorization avoids Clerk/Auth0 setups, how signed HttpOnly cookies protect users, and how the Google OAuth verifier handshake functions under the hood.
3. **From Passive CRM to Active Agent**: Explore how DareXAI isn't just a grid of data but an active digital operator. Explain how AI tool calling lets a llama model write real tasks, update deals, and dispatch SMS alerts.
4. **WhatsApp Simulation Console**: Praise the webhook trace developer experience, showing how a local sandbox lets teams test production WhatsApp setups offline.
