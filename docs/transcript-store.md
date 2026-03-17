# Transcript Store Module

## File
- lib/transcript-store.ts

## Purpose
The transcript store module provides best-effort persistence of chat turns to Neon/Postgres. It is designed so chat generation continues even if database logging fails.

## Public API
### logTranscriptMessage(message)
- Input shape:
  - threadId: OpenAI thread identifier
  - role: user | assistant | error
  - content: message text
  - model: optional model name
  - latencyMs: optional run latency in milliseconds
  - error: optional error marker/details
- Behavior:
  - Skips immediately if Postgres is not configured
  - Ensures schema exists (tables/indexes)
  - Upserts/fetches conversation by threadId
  - Inserts one row into transcript_messages
  - Catches and logs errors without throwing to callers

## Internal Functions
### isTranscriptLoggingConfigured()
Checks whether database logging should run by detecting Postgres runtime variables.

### ensureTranscriptSchema()
Creates required tables and indexes if missing:
- conversations
- transcript_messages
- idx_transcript_messages_conversation_id
- idx_transcript_messages_created_at

The module memoizes schema initialization with schemaInitPromise so concurrent calls do not run duplicate initialization work.

### ensureConversation(threadId)
Upserts a conversation row using thread_id and returns the numeric conversation id.

## Data Model Used
### conversations
- id: BIGSERIAL primary key
- thread_id: TEXT unique
- created_at: TIMESTAMPTZ default now

### transcript_messages
- id: BIGSERIAL primary key
- conversation_id: FK to conversations(id)
- role: user | assistant | error
- content: TEXT
- model: TEXT nullable
- latency_ms: INTEGER nullable
- error: TEXT nullable
- created_at: TIMESTAMPTZ default now

## Reliability and Failure Model
- Best-effort logging by design.
- Database failures are logged with console.error and do not block user chat responses.
- If DB env vars are missing, function no-ops safely.

## Integration Point
The server action in app/actions.ts calls logTranscriptMessage for:
- user turn
- assistant turn
- non-completed run fallback/error turn

## Operational Notes
- Manual schema provisioning via db/schema.sql is optional because runtime auto-init exists.
- In production, explicit migration workflows are still recommended for schema governance.
