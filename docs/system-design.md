# System Design

## Overview
This application is a Next.js App Router chat interface for dental insurance support. It uses OpenAI Assistants API with file search to answer user questions from uploaded PDF plan documents, speaks responses aloud via Amazon Polly, and logs chat transcripts to Neon/Postgres.

Primary goals:
- Provide concise, context-grounded responses for Cigna dental plans
- Keep a persistent conversation thread for follow-up questions
- Apply business messaging and guardrails from app context
- Persist conversation transcripts for testing, auditing, and analytics
- Speak assistant responses using high-quality cloud TTS (Amazon Polly)

## High-Level Architecture

### Client Layer
- File: `app/page.tsx`
- Responsibilities:
  - Compose and render the full-screen chat UI from sub-components
  - Manage shared state: messages, threadId, language, dark mode, voice toggle
  - Create and persist analytics IDs (userId/sessionId)
  - Orchestrate the greeting intro sequence (delayed typing indicator → message)
  - Submit user messages to the server action
  - Translate existing assistant messages when the language dropdown changes
  - Trigger TTS playback and notification sound on each assistant reply
- Sub-components (see `docs/components.md`):
  - `ChatHeader` — logo, language selector, voice toggle, dark mode toggle
  - `MessageList` — scrollable message area and typing indicator
  - `MessageBubble` — individual message bubble with speak/stop button
  - `ChatInput` — textarea and send button form
- Custom hook (see `docs/hooks/usePolly.md`):
  - `usePolly` — all Amazon Polly audio playback state and logic

### Server Layer
- File: `app/actions.ts`
- Responsibilities:
  - Validate required environment variables
  - Create or reuse OpenAI thread
  - Send user message into thread
  - Log user, assistant, and error turns to transcript storage
  - Run assistant with additional runtime instructions
  - Return latest assistant text plus threadId to client
  - Translate existing assistant messages into the selected UI language via `translateMessages()`

### Text-to-Speech Layer
- File: `lib/polly.ts`
- Responsibilities:
  - Accept text and language code, return base64-encoded MP3
  - Map language to the appropriate Polly voice (Joanna/Lucia/Linh)
  - Map language to the appropriate engine (neural/standard)
  - Strip URLs from text before synthesis to avoid Polly reading raw links
  - Marked `"use server"` — runs server-side only, never exposes AWS credentials to client

### Transcript Persistence Layer
- Files: `lib/transcript-store.ts`, `db/schema.sql`
- Responsibilities:
  - Ensure transcript tables and indexes exist (auto-init on first write)
  - Upsert conversation rows by OpenAI thread_id and optional analytics IDs
  - Insert message-level transcript rows with role/content/timestamps
  - Store optional metadata (user_id, session_id, model, latency, error)
  - Operate in best-effort mode so logging failures do not break chat

### Internationalization Layer
- File: `app/i18n.ts`
- Responsibilities:
  - Define localized initial greeting strings (en/es/vi)
  - Define all localized UI label strings (buttons, placeholders, indicators)
  - Export typed maps keyed by `PageLanguage`

### Shared Types
- File: `app/types.ts`
- Exports: `ChatMessage`, `AnalyticsIds`, `PageLanguage`, `UiText`

### Prompt and Business Context Layer
- File: `app/company-context.ts`
- Responsibilities:
  - Define business context (pricing, enrollment, contact info, policies)
  - Build runtime instruction string via `buildSalesSystemPrompt()`
  - Enforce response style and CTA behavior

### Assistant Provisioning Layer
- File: `scripts/setup-assistant.mjs`
- Responsibilities:
  - Create vector store
  - Attach pre-uploaded OpenAI file IDs
  - Wait for indexing
  - Create assistant with file_search tool and persona instructions
  - Print OPENAI_ASSISTANT_ID and OPENAI_VECTOR_STORE_ID for .env.local

## Request/Response Flow
1. Page loads → greeting timeout fires after 1.2s → typing indicator shown → greeting message appears.
2. User types a message and submits (Enter or Send button).
3. UI calls `getAIResponse(input, threadId, analyticsIds)` server action.
4. Server action checks `OPENAI_API_KEY` and `OPENAI_ASSISTANT_ID`.
5. Server action creates a new thread or reuses existing threadId.
6. User message is appended to thread and logged to transcript storage with optional userId/sessionId.
7. Assistant run is executed with:
   - `assistant_id` from env
   - `additional_instructions` from `buildSalesSystemPrompt()`
8. Server fetches latest assistant message, strips citation markers, logs the assistant turn, and returns `{ content, threadId }`.
9. If run status is not completed, a fallback response is returned and an error transcript row is logged.
10. UI appends assistant message, plays notification sound, and (if voice is enabled) calls `synthesizeSpeech()` via `usePolly`.
11. `lib/polly.ts` (server-side) calls Amazon Polly, returns base64 MP3.
12. Client decodes base64 → Blob URL → plays via `HTMLAudioElement`.
13. When the language dropdown changes, the greeting swaps from `app/i18n.ts` immediately.
14. Existing assistant replies (excluding the intro greeting) are batched through `translateMessages()` and replaced in-place.

## Text-to-Speech Design

### Voice Configuration
| Language | Voice  | Engine   |
| -------- | ------ | -------- |
| English  | Joanna | standard |
| Spanish  | Lucia  | standard |
| Vietnamese | Linh | standard |

### Playback Controls
- Global **Voice On/Off** toggle in header — enables/disables auto-play and stops current audio
- Per-message **Speak/Stop** button — manually trigger or stop playback for any assistant message
- Race condition protection via `playRequestIdRef` — stale Polly responses are discarded
- Blob URLs are revoked after playback to prevent memory leaks
- The intro greeting does not trigger notification sound or auto-play TTS

### Notification Sound
- Short descending tone (880Hz → 660Hz, ~0.25s) generated via Web Audio API
- Plays on each new assistant reply after the intro greeting, regardless of voice toggle state

## Data and State Model

### Client state in `app/page.tsx`
- `threadId: string | undefined`
- `messages: ChatMessage[]` — `{ id, role, content }`
- `input: string`
- `loading: boolean`
- `isTranslating: boolean`
- `isDark: boolean`
- `language: PageLanguage` — `"en" | "es" | "vi"`
- `voiceEnabled: boolean`
- Analytics IDs:
  - `userId` (persistent across browser visits via localStorage)
  - `sessionId` (per browser tab/session via sessionStorage)

### TTS state (managed by `usePolly` hook)
- `speakingId: string | null` — ID of currently speaking message
- `ttsLoading: boolean` — Polly request in-flight
- `ttsErrorId: string | null` — ID of message that failed TTS

### Server return contract (`app/actions.ts`)
- `{ content: string, threadId: string }`

### Database model (Neon/Postgres)
- conversations:
  - id, thread_id (unique), user_id, session_id, created_at
- transcript_messages:
  - id, conversation_id (FK), user_id, session_id, role, content, model, latency_ms, error, created_at

## Environment Configuration
Required:
- `OPENAI_API_KEY`
- `OPENAI_ASSISTANT_ID`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (defaults to `us-east-1` if not set)

Generated/optional:
- `OPENAI_VECTOR_STORE_ID` (useful for tracking and operations)

Database (required for transcript logging):
- Neon/Postgres connection variables (e.g. `POSTGRES_URL` and related runtime vars)
- If missing, chat still works and transcript logging is skipped.
- Schema is auto-created at runtime on first transcript write.
- Manual SQL initialization via `db/schema.sql` remains optional.

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
- Header includes company logo, assistant title, language selector, voice toggle, and dark mode toggle
- Language selector switches UI strings and Polly voice simultaneously
- Language selector also translates existing assistant replies into the selected language
- Voice toggle enables/disables auto-play TTS for all assistant messages
- Each assistant message has a per-message Speak/Stop button
- Greeting message is delivered after a short typing indicator delay (simulates a live agent)
- Notification sound plays on each new assistant reply after the intro greeting (Web Audio API, no file required)
- Dark mode toggle in top-right (moon/sun icon); logo inverts in dark mode for visibility
- Responsive layout — chat bubble and input scale for mobile viewports

## File Structure
```
app/
  page.tsx              — Chat page orchestrator
  actions.ts            — OpenAI server action
  company-context.ts    — Business prompt and guardrails
  layout.tsx            — Root layout
  globals.css           — Global styles
  types.ts              — Shared TypeScript types
  i18n.ts               — Localized strings (en/es/vi)
  hooks/
    usePolly.ts         — TTS state and audio playback logic
  components/
    ChatHeader.tsx      — Header bar with controls
    MessageList.tsx     — Scrollable message area
    MessageBubble.tsx   — Single message + speak button
    ChatInput.tsx       — Textarea + send button
lib/
  polly.ts              — Amazon Polly server-side synthesis
  transcript-store.ts   — Neon/Postgres transcript persistence
db/
  schema.sql            — Database schema (manual init reference)
scripts/
  setup-assistant.mjs   — OpenAI assistant and vector store provisioning
docs/
  system-design.md      — This file
  components.md         — UI component reference
  database-schema.md
  company-context.md
  explanations/
    chat-how-it-works.md  — End-to-end chat behavior overview
    chat-transcription.md
  pricing/
    ai-model-pricing.md
    amazon-polly-pricing.md
    neon-db-pricing.md
    vercel-pricing.md
  hooks/
    usePolly.md
  lib/
    polly.md
    transcript-store.md
wordpress-integration/
  README.md             — WordPress embed setup guide
  chat-embed.html       — Iframe popup snippet
```

## Retrieval-Augmented Generation (RAG) Design
Knowledge source:
- PDFs uploaded to OpenAI storage (file IDs configured in setup script)

Retrieval mechanism:
- Assistant tool: `file_search`
- Vector store created by setup script and bound to assistant

Control mechanism:
- Runtime instructions from company context are always injected as `additional_instructions`
- This keeps response style and policy controls centralized in `app/company-context.ts`

## Operational Workflow
1. Upload plan PDFs to OpenAI storage.
2. Run `npm run setup-assistant`.
3. Copy printed IDs into `.env.local`.
4. Add AWS Polly credentials and region to `.env.local`.
5. Connect Neon/Postgres.
6. Set environment variables in local and Vercel.
7. Run `npm run dev` or deploy.
8. Verify transcript rows in Neon after test chats.

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
- Switch Polly voices to generative engine when Vietnamese support becomes available
- Add speech-to-text (microphone input) using the Web Speech API or Amazon Transcribe
