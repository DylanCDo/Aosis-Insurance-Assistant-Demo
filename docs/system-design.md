# System Design

## Overview
This application is a Next.js App Router chat interface for dental insurance support. It uses OpenAI Assistants API with file search to answer user questions from uploaded PDF plan documents and logs chat transcripts to Neon/Postgres.

Primary goals:
- Provide concise, context-grounded responses for Cigna dental plans
- Keep a persistent conversation thread for follow-up questions
- Apply business messaging and guardrails from app context
- Persist conversation transcripts for testing, auditing, and analytics

## High-Level Architecture

### Client Layer
- File: app/page.tsx
- Responsibilities:
  - Render full-screen chat UI
  - Manage local state: messages, threadId, loading, dark mode
  - Create and persist analytics IDs (userId/sessionId)
  - Submit user messages to server action
  - Display assistant responses and error text

### Server Layer
- File: app/actions.ts
- Responsibilities:
  - Validate required environment variables
  - Create or reuse OpenAI thread
  - Send user message into thread
  - Log user, assistant, and error turns to transcript storage
  - Run assistant with additional runtime instructions
  - Return latest assistant text plus threadId to client

### Transcript Persistence Layer
- Files: lib/transcript-store.ts, db/schema.sql
- Responsibilities:
  - Ensure transcript tables and indexes exist (auto-init on first write)
  - Upsert conversation rows by OpenAI thread_id and optional analytics IDs
  - Insert message-level transcript rows with role/content/timestamps
  - Store optional metadata (user_id, session_id, model, latency, error)
  - Operate in best-effort mode so logging failures do not break chat

### Prompt and Business Context Layer
- File: app/company-context.ts
- Responsibilities:
  - Define business context (pricing, enrollment, contact info, policies)
  - Build runtime instruction string via buildSalesSystemPrompt()
  - Enforce response style and CTA behavior

### Assistant Provisioning Layer
- File: scripts/setup-assistant.mjs
- Responsibilities:
  - Create vector store
  - Attach pre-uploaded OpenAI file IDs
  - Wait for indexing
  - Create assistant with file_search tool and persona instructions
  - Print OPENAI_ASSISTANT_ID and OPENAI_VECTOR_STORE_ID for .env.local

## Request/Response Flow
1. User enters text in the UI (app/page.tsx).
2. UI calls getAIResponse(input, threadId) server action.
3. Server action checks OPENAI_API_KEY and OPENAI_ASSISTANT_ID.
4. Server action creates a new thread or reuses existing threadId.
5. User message is appended to thread and logged to transcript storage with optional userId/sessionId.
6. Assistant run is executed with:
   - assistant_id from env
   - additional_instructions from buildSalesSystemPrompt()
7. Server fetches latest assistant message, strips citation markers, logs the assistant turn, and returns:
   - content
   - threadId
8. If run status is not completed, a fallback response is returned and an error transcript row is logged.
9. UI appends assistant message and keeps threadId for next turn.

## Retrieval-Augmented Generation (RAG) Design
Knowledge source:
- PDFs uploaded to OpenAI storage (file IDs configured in setup script)

Retrieval mechanism:
- Assistant tool: file_search
- Vector store created by setup script and bound to assistant

Control mechanism:
- Runtime instructions from company context are always injected as additional_instructions
- This keeps response style and policy controls centralized in app/company-context.ts

## Data and State Model
Client state in app/page.tsx:
- threadId: string | undefined
- messages: array of { role: "user" | "assistant", content: string }
- analytics IDs:
  - userId (persistent across browser visits)
  - sessionId (per browser tab/session)
- input: string
- loading: boolean
- isDark: boolean

Server return contract in app/actions.ts:
- { content: string, threadId: string }

Database model (Neon/Postgres):
- conversations:
  - id, thread_id (unique), user_id, session_id, created_at
- transcript_messages:
  - id, conversation_id (FK), user_id, session_id, role, content, model, latency_ms, error, created_at

## Environment Configuration
Required:
- OPENAI_API_KEY
- OPENAI_ASSISTANT_ID

Generated/optional:
- OPENAI_VECTOR_STORE_ID (useful for tracking and operations)

Database (required for transcript logging):
- Neon/Postgres connection variables (for example POSTGRES_URL and related runtime vars)
- If missing, chat still works and transcript logging is skipped.
- Schema is auto-created at runtime on first transcript write.
- Manual SQL initialization via db/schema.sql remains optional.

## Security and Guardrails
- OpenAI API key is used only server-side in server action and setup script
- UI never receives secrets
- Database credentials are server-only environment variables
- Business guardrails are embedded in buildSalesSystemPrompt(), including:
  - concise response style
  - uncertainty handling
  - controlled enrollment link mention frequency

## Reliability Behavior
- Transcript logging is intentionally best-effort.
- If database writes fail, chat continues and the error is logged server-side.
- This avoids user-facing outages caused by telemetry persistence issues.

## UI/UX Notes
- Full-screen chat layout
- Header includes company logo and assistant title
- Dark mode toggle in top-right (moon/sun icon)
- Logo inverts in dark mode for visibility

## Operational Workflow
1. Upload plan PDFs to OpenAI storage.
2. Run npm run setup-assistant.
3. Copy printed IDs into .env.local.
4. Connect Neon/Postgres.
5. Set environment variables in local and Vercel.
6. Run npm run dev or deploy.
7. Verify transcript rows in Neon after test chats.

## Known Constraints
- The system depends on external OpenAI availability and API compatibility.
- Responses are only as current as uploaded PDFs and company context.
- OpenAI threadId is client-session scoped unless mapped to authenticated users.
- Transcript logging depends on database availability but is non-blocking for chat responses.

## Extension Points
- Map anonymous analytics IDs to authenticated users when auth is introduced
- Add source citation rendering in UI instead of stripping citations
- Add multi-assistant support for different insurance product lines
- Add transcript viewer/admin dashboard and export workflows
- Add admin tooling for rotating vector stores and file IDs
