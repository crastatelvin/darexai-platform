<div align="center">

# 🧠 DAREXAI

### Autonomous Agentic Operations (Ops) CRM & Customer Communications Engine

[![Next.js](https://img.shields.io/badge/Next.js-16.2%2B-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Groq](https://img.shields.io/badge/Provider-Groq-f55036?style=for-the-badge)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> **DareXAI** is a production-grade Autonomous Agentic Operations & CRM Engine. Designed to function as an AI digital worker, it autonomously processes customer communications, executes database updates, manages pipelines, qualifies inbound leads, and handles customer messaging workflows (including WhatsApp Meta Cloud API integrations) using dynamic tool-calling and structured reasoning.

<br/>

![Database](https://img.shields.io/badge/Database-PostgreSQL_%2B_MongoDB-blue?style=for-the-badge) ![AI Engine](https://img.shields.io/badge/Groq-Llama_3.3_70b-orange?style=for-the-badge) ![Authentication](https://img.shields.io/badge/Security-JWT_Auth_%2B_PKCE_Verifier-purple?style=for-the-badge) ![WhatsApp Integration](https://img.shields.io/badge/WhatsApp-Meta_Cloud_API-emerald?style=for-the-badge)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Agentic Autonomy & Ops Workflows](#-agentic-autonomy--ops-workflows)
- [Application Preview](#-application-preview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Testing & Verification](#-testing--verification)
- [Security Notes](#-security-notes)
- [Design Decisions](#-design-decisions)
- [License](#-license)

---

## 🧠 Overview

DareXAI is built to solve core business operation challenges: consolidating pipelines, managing customers, and automating manual communication tasks within a clean, multi-tenant workspace. 

The application uses a **hybrid database model** (PostgreSQL + MongoDB) to combine strict ACID constraints for relational CRM models (deals, pipeline stages, users) with fast, horizontal timeline logs and chat history document structures. The backend implements secure tenant-isolated routes via middleware and headers, routes dynamic completions to the Groq API, and exposes a production-grade webhook receiver for simulated or real WhatsApp customer message parsing.

---

## 🤖 Agentic Autonomy & Ops Workflows

DareXAI is built not just to record data, but to act autonomously as an Agentic Operator in your business. It bridges the gap between customer communication channels and backend databases through four primary autonomous agentic layers:

```mermaid
graph TD
    A[Inbound Event: Webhook / Form / Chat] --> B{Agentic Reasoning Layer}
    B -->|Tool Calling| C[Prisma ORM Database Operations]
    B -->|Decision Tree| D[Lead Scoring & Route Matrix]
    B -->|Llama-3.3 LLM| E[Structured Outbound Messaging]
    C --> F[Automatic Task & CRM Pipeline Transitions]
    D --> G[Autonomous Stage Escalation]
    E --> H[WhatsApp / Email Dispatch]
```

### 1. Dynamic Tool-Calling Core
Rather than relying on hardcoded logic, the **AI Business Agent** uses Groq's model to dynamically decide when and how to invoke tools:
- **`search_contacts`**: Scans relational databases using semantic keywords to locate customer workspaces.
- **`create_task`**: Autonomously registers follow-up items and links them to respective accounts when users mention reminders.
- **`update_opportunity`**: Moves opportunities along stages in the CRM based on conversational status updates.
- **`fetch_business_metrics`**: Computes pipeline statistics and filters performance data on demand.

### 2. Autonomous Event Loop & Auto-Reply
The WhatsApp CRM integration includes an autonomous responder:
- **Sentiment & Intent Classifier**: Analyzes incoming messages to determine customer mood and purchase intent.
- **Automated Answer Generator**: Drafts and sends contextually appropriate, brand-aligned replies without human intervention, maintaining state within the MongoDB timeline database.

### 3. Structured Lead Qualification Pipeline
The platform includes an automated qualification pipeline:
- **Zero-Shot Evaluation**: Scores inbound leads on multiple dimensions (budget, timeline, readiness) using structured JSON output.
- **Auto-Escalation**: Triggers follow-up actions, generates appropriate CRM deals, and issues alerts based on the computed qualification threshold.

### 4. Tenant-Isolated Multi-Workspace Security
All agentic tool executions are strictly bound to the requesting client's tenant space, preventing database leaking or cross-organization execution anomalies.

---

## 🖼️ Application Preview

<div align="center">

### 1) Landing Page & Sandbox Login
![Landing Page](public/screenshots/01-landing-page.png)

<br/>

### 2) Dashboard Overview & Key Metrics
![Dashboard Overview](public/screenshots/02-overview.png)

<br/>

### 3) Real-time CRM Kanban Board
![CRM Kanban Board](public/screenshots/03-crm-kanban.png)

<br/>

### 4) Interactive AI Agent with Tool Calling
![AI Agent](public/screenshots/04-ai-agent.png)

<br/>

### 5) Dedicated WhatsApp Inbox & Simulated Webhook Sandbox
![WhatsApp Inbox](public/screenshots/05-whatsapp-inbox.png)

<br/>

### 6) Unified Inbox Timeline Logs
![Unified Inbox Timeline](public/screenshots/06-unified-timeline.png)

<br/>

### 7) Automated Lead Qualification Runner
![Lead Automation](public/screenshots/07-lead-automation.png)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗄️ **Multi-Tenant Hybrid DB** | PostgreSQL holds transactional entities (Tenants, Contacts, Tasks) while MongoDB holds chat records and inbox logs. Isolated globally via tenant context request hooks. |
| 🔐 **Secure JWT Auth (Google PKCE)** | Custom secure cookie-based login utilizing cryptographically signed state verifiers, access token rotations, and a sandbox mock developer flow. |
| 🎛️ **Kanban Pipeline Board** | Drag-and-drop or select opportunity stages. Built-in AI analysis evaluates deal status and computes **AI Next Best Actions**. |
| 💬 **AI Agent with Tool Calling** | Multi-tool agent utilizing Groq (`llama-3.3-70b-versatile`) to search contacts, update CRM pipelines, assign reminders, simulate WhatsApps, and fetch KPIs. |
| 📱 **WhatsApp CRM Integration (Bonus)** | Meta Cloud API Webhook verification (`GET`) and payload parser (`POST`). Auto-performs sentiment/intent analysis and issues Llama-based replies. |
| 🔬 **Webhook Sandbox Console** | Built-in interactive console on the WhatsApp screen to inject simulated customer webhooks, viewing log traces and automated replies in real time. |
| 🚀 **Auto Onboarding Seeding** | Creates clean database schemas for Google OAuth users, but auto-seeds sandbox developers with active pipelines, timelines, and chats on mock registration. |
| 🧪 **Hardened Test Runner** | Unit tests validating JWT cryptographic integrity, PKCE methods, tenant header extractors, state logic, and React alert components. |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                             NextJS App Router UI                           │
│                                                                            │
│  Mock/OAuth Login ──► Kanban Pipeline ──► Streaming Agent ──► WhatsApp Inbox│
│                                                                            │
└────────┬───────────────────────┬──────────────────────────┬────────────────┘
         │                       │                          │
         ▼                       ▼                          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                             API Route Handlers                             │
│                                                                            │
│     JWT Auth / Cookies Middleware  ──►  Tenant Header Scoping Hook         │
│                                                                            │
│   ┌────────────────────┼─────────────────────┼─────────────────────────┐   │
│   ▼                    ▼                     ▼                         ▼   │
│ /api/auth/*        /api/crm/*            /api/agent/chat           /api/whatsapp/*
│ (Google/Mock)   (Contacts/Deals)      (Streaming Groq SDK)     (Meta API/Webhook)
└────────────────────────┼─────────────────────┼─────────────────────────┼───┘
                         │                     │                         │
                         ▼                     ▼                         ▼
            ┌────────────────────────┐   ┌───────────────────────────────────┐
            │   PostgreSQL Schema    │   │         MongoDB Database          │
            │                        │   │ (Replica-Set/Standalone logs)     │
            │  Relational Entities   │   │                                   │
            │ (Prisma Client Core)   │   │  Chat History, Timeline messages  │
            │                        │   │ (Prisma Client MongoDB Generator) │
            └────────────────────────┘   └───────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core Framework** | Next.js 15+ (App Router, Server Actions, API Routes) |
| **Styling (CSS)** | TailwindCSS + custom Glassmorphic CSS system |
| **AI Provider** | Groq Chat Completions API (`llama-3.3-70b-versatile`) |
| **ORM** | Prisma 5.22.0 (Configured with PostgreSQL & MongoDB Clients) |
| **Relational Database** | PostgreSQL 15 |
| **Document Store** | MongoDB 6.0 |
| **Verification & Tests** | TypeScript Unit-Test Runner (utilizing `tsx` + React elements assertions) |

---

## 📁 Project Structure

```
darexai-platform/
│
├── prisma/
│   ├── schema.prisma              # PostgreSQL Relational Schema definition
│   └── mongodb.prisma             # MongoDB timeline/chat Schema definition
│
├── tests/
│   └── run.ts                     # Custom unit testing suite
│
├── src/
│   ├── app/
│   │   ├── page.tsx               # Portal Landing Page & Login form
│   │   ├── globals.css            # Stylesheets with glassmorphism tokens
│   │   ├── layout.tsx             # Standard site wrapper
│   │   ├── api/                   # API Route Handlers
│   │   │   ├── auth/              # Mock Login & OAuth PKCE handlers
│   │   │   ├── agent/             # Streaming Chat agent & conversions list
│   │   │   ├── crm/               # Contacts, Deals, and Timeline endpoints
│   │   │   └── whatsapp/          # Outbound sender & Webhook listeners
│   │   └── dashboard/             # Dashboard Layout & Core Screens
│   │       ├── crm/               # Kanban board & Contacts views
│   │       ├── agent/             # Conversational Agent chat view
│   │       ├── timeline/          # Unified Inbox log stream
│   │       ├── automation/        # Lead Qualification workflow runner
│   │       └── whatsapp/          # Dedicated WhatsApp Inbox UI + Console
│   │
│   ├── components/                # Shared layout & Alert components
│   ├── generated/                 # Generated MongoDB Prisma Client
│   └── lib/                       # Connection clients and authorization helpers
│       ├── auth.ts                # PKCE cryptographics & JWT signers
│       ├── db.ts                  # PostgreSQL Prisma instance reload protection
│       ├── mongodb.ts             # MongoDB Prisma instance setup
│       ├── protected-route.ts     # Route isolation & tenant extraction helper
│       ├── seed.ts                # Sandbox seeding hydration script
│       └── whatsapp.ts            # Meta Cloud outbound sender API wrapper
│
├── docker-compose.yml             # Local Docker containers configuration
├── package.json                   # Project scripts and dependencies list
├── tsconfig.json                  # TypeScript compilation rules
├── .env.example                   # Env templates setup
└── README.md                      # Project documentation (this file)
```

---

## 🚀 Installation

### 1) Clone Repository

```bash
git clone git@github.com:crastatelvin/darexai-platform.git
cd darexai-platform
```

### 2) Spin Up Containers

Launch local PostgreSQL and MongoDB databases inside Docker containers:

```bash
sudo docker compose up -d
```

Initialize the MongoDB replica set (required for Prisma transaction support):

```bash
sudo docker exec darexai-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: '127.0.0.1:27017'}]})"
```

### 3) Hydrate Environment Variables

Copy the template environment configurations to `.env` file:

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```bash
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/darexai_platform?schema=public"
MONGODB_URL="mongodb://localhost:27017/darexai_platform?replicaSet=rs0"
GROQ_API_KEY="gsk_..."
WHATSAPP_VERIFY_TOKEN="darexai-whatsapp-token-secret-123"
```

### 4) Run Database Migrations

Generate schemas and push structure tables to local databases:

```bash
npx prisma db push --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/mongodb.prisma
```

### 5) Run Development Server

Install local dependencies and run Next.js development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to interact with the platform.

---

## 💻 Usage

### 1. Developer Sandbox Testing
On the landing page (`http://localhost:3000`), click **Sandbox Developer Login** to instantly create a mock tenant workspace seeded with opportunities, contacts, tasks, and historical chat events.

### 2. Conversational Business Agent
Navigate to **AI Business Agent**. Submit messages such as:
- *"Fetch business metrics"*
- *"Search contacts matching Alice"*
- *"Update opportunity AI Consultation to WON"*
- *"Send a simulated WhatsApp to Bob saying Hello"*

The agent will stream answers back in real-time, executing corresponding database actions securely scoped to your tenant.

### 3. WhatsApp Integration & Simulation Webhook Testing
Navigate to **WhatsApp Inbox**:
1. Click **Simulate Webhook Message** on the top right.
2. Enter custom details (Sender Name, Phone, and text content).
3. Click **Inject Webhook Event**.
4. Observe the Webhook Trace Console executing:
   - Webhook callback receipt
   - Inbound MongoDB timeline logging
   - AI Sentiment & Intent analysis
   - Dynamic Groq Llama-3.3 response generation
   - Outbound reply logging
5. Watch the message and its automated reply populate in the chat thread list instantly.
6. Enter text in the bottom reply box and hit send to test manual agent override messaging.

---

## 📡 API Reference

### Auth Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/mock` | Sandbox mock registration/login (Seeds database) |
| `GET` | `/api/auth/google/login` | Redirect to Google OAuth consent page (Generates PKCE verifier) |
| `GET` | `/api/auth/google/callback` | Capture Google OAuth callback (Validates verifier state & logs in) |
| `POST` | `/api/auth/refresh` | Rotate expired JWT access tokens using secure cookies |
| `POST` | `/api/auth/logout` | Revoke active refresh tokens and clear HTTP cookies |

### CRM Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/crm/contacts` | Fetch list of contacts in current tenant |
| `GET` | `/api/crm/opportunities` | Fetch opportunities list for Kanban board |
| `GET` | `/api/crm/timeline` | Fetch communication history timeline logs (WhatsApp, emails, calls) |

### AI & Automation Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/agent/chat` | Streaming agent chat route (Triggers tool bindings) |
| `POST` | `/api/automation/trigger` | Intake form lead qualification workflow execution |

### WhatsApp Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/whatsapp/webhook` | Meta Webhook subscription token verification challenge |
| `POST` | `/api/whatsapp/webhook` | Receive incoming messages (Supports Meta payload & Simulation JSON) |
| `POST` | `/api/whatsapp/send` | Send manual WhatsApp message (Meta Cloud API / Simulation mock log) |

---

## ⚙️ Configuration

`/.env` variables description:

```bash
# Relational DB Connect
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/darexai_platform?schema=public"

# Document DB Connect
MONGODB_URL="mongodb://localhost:27017/darexai_platform?replicaSet=rs0"

# App Access URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google Auth PKCE Setup
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Groq API Integration (LLM Engine)
GROQ_API_KEY="gsk_..."

# WhatsApp Integration Settings
WHATSAPP_VERIFY_TOKEN="darexai-whatsapp-token-secret-123"
WHATSAPP_ACCESS_TOKEN="your-meta-access-token"
WHATSAPP_PHONE_NUMBER_ID="your-meta-phone-number-id"
WHATSAPP_AUTO_REPLY="true"
```

---

## 🧪 Testing & Verification

Run the custom TypeScript unit test runner to verify crypto routines, auth tokens, verifiers, and React alert components:

```bash
npm test
```

Verify Next.js production compile and bundles structure:

```bash
npm run build
```

---

## 🔒 Security Notes

- **Multi-Tenant Scoping**: All relational DB queries evaluate requests against the extracted token's `tenantId` field, preventing unauthorized database leaking between accounts.
- **PKCE Flow Verification**: High-strength random code verifiers are generated locally, hashed via SHA-256, and verified during token exchange callback checks.
- **Token Tampering Block**: Cryptographically secure token verification keys are validated on the server for all protected API route requests.
- **Safe Webhook Fallback**: In the absence of credentials, the webhook runs in **Simulation Mode**, logging messages safely in local files/logs and preventing endpoint crashes.

---

## 🧭 Design Decisions

- **Replica-Set MongoDB**: We initiated a single-node replica set to satisfy Prisma's transactional updates schema without requiring clustered staging architectures.
- **JSON Mode Enforcers**: We utilized Groq's standard JSON Response Format on Llama-3.3 models to enforce structured lead qualification scores.
- **SessionStorage Active Chat**: We configured active conversations IDs to cache in `sessionStorage` in order to preserve active chat windows during React sidebar page unmounts.

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

<br/>

<div align="center">
                          Built by Telvin Crasta · Production-ready · Live today
</div>
