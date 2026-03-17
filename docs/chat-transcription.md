# Chat Transcription Design

## Purpose
This document explains how chat transcription (text turn logging) works in this application, where records are stored, and how to verify it in Neon/Postgres.

## Scope
- Logs text conversations between user and assistant
- Logs metadata for observability (model, latency, errors)
- Uses best-effort writes so chat UX is never blocked by database errors

This is not audio transcription.

## Runtime Flow
1. A user submits a message from the UI in app/page.tsx.
2. The server action getAIResponse in app/actions.ts receives the input.
3. The action creates or reuses an OpenAI thread ID.
4. The user message is sent to OpenAI thread.
5. The user turn is logged via logTranscriptMessage in lib/transcript-store.ts.
6. The assistant run is executed.
7. On success, assistant text is fetched and logged.
8. On non-completed run status, an error turn is logged with fallback content.
9. The response is returned to the client.

## Storage Model
Schema file: db/schema.sql

Note: The runtime logger auto-creates transcript tables and indexes on first write.
The schema file is still available for manual/explicit database management.

### conversations
- id: BIGSERIAL primary key
- thread_id: TEXT unique, OpenAI thread identifier
- created_at: timestamp

### transcript_messages
- id: BIGSERIAL primary key
- conversation_id: foreign key to conversations(id)
- role: user | assistant | error
- content: message text
- model: optional model name
- latency_ms: optional runtime latency
- error: optional error marker/details
- created_at: timestamp

Indexes are included for conversation lookup and recent-message queries.

## Logging Behavior
Implementation file: lib/transcript-store.ts

- If Postgres env vars are not configured, logging is skipped.
- If schema objects are missing, they are created automatically on first write.
- If insert/query fails, errors are caught and logged to server logs.
- Chat response still returns normally (best-effort logging).

## Environment Requirements
- Neon/Vercel Postgres connection env vars must be present in runtime.
- OPENAI_API_KEY and OPENAI_ASSISTANT_ID are still required for chat generation.

## Setup Checklist
1. Connect Neon to the Vercel project.
2. Confirm Vercel env vars are available in target environment.
3. Deploy or redeploy the application.
4. Send a test chat message.

Optional:
- Run db/schema.sql in Neon SQL editor if you want explicit schema provisioning.

## Verification Queries
Run in Neon SQL editor:

```sql
select count(*) from conversations;
select count(*) from transcript_messages;

select c.thread_id, m.role, m.model, m.latency_ms, m.created_at
from transcript_messages m
join conversations c on c.id = m.conversation_id
order by m.created_at desc
limit 25;
```

## Troubleshooting
### No rows inserted
- Ensure app runtime has Postgres env vars for the same Neon database you are checking.
- Check deployment env vars and environment scope (Production/Preview/Development).
- Review Vercel function logs for "Transcript logging failed" messages.

### Chat works but transcript missing intermittently
- Logging is intentionally non-blocking; transient DB/network issues can skip writes.
- Use retries/queueing if guaranteed delivery is needed.

## Extension Ideas
- Add user/session IDs for per-user analytics.
- Add an admin transcript viewer route.
- Export transcripts to Sheets/Docs in a background job.
- Add retention cleanup job for compliance.
