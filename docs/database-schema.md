# Database Schema

## Source
- db/schema.sql

## Overview
This application stores chat transcript analytics in Neon/Postgres using two tables:
- conversations
- transcript_messages

The schema supports:
- OpenAI thread-level grouping
- Per-turn transcript storage
- Anonymous analytics dimensions (user_id, session_id)
- Observability metadata (model, latency, error)

## Entity Relationship
- One conversation has many transcript messages.
- Relationship key:
  - transcript_messages.conversation_id -> conversations.id
- Delete behavior:
  - ON DELETE CASCADE (deleting a conversation deletes related messages)

## Table: conversations
Purpose: Stores one row per OpenAI thread.

Columns:
- id: BIGSERIAL, primary key
- thread_id: TEXT, unique, not null
- user_id: TEXT, nullable
- session_id: TEXT, nullable
- created_at: TIMESTAMPTZ, not null, default NOW()

Constraints:
- PRIMARY KEY (id)
- UNIQUE (thread_id)

## Table: transcript_messages
Purpose: Stores each logged chat turn.

Columns:
- id: BIGSERIAL, primary key
- conversation_id: BIGINT, not null, FK to conversations(id)
- user_id: TEXT, nullable
- session_id: TEXT, nullable
- role: TEXT, not null, check in ('user', 'assistant', 'error')
- content: TEXT, not null
- model: TEXT, nullable
- latency_ms: INTEGER, nullable
- error: TEXT, nullable
- created_at: TIMESTAMPTZ, not null, default NOW()

Constraints:
- PRIMARY KEY (id)
- FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
- CHECK (role IN ('user', 'assistant', 'error'))

## Indexes
Defined indexes:
- idx_transcript_messages_conversation_id on transcript_messages(conversation_id)
- idx_transcript_messages_created_at on transcript_messages(created_at DESC)
- idx_transcript_messages_user_id on transcript_messages(user_id)
- idx_transcript_messages_session_id on transcript_messages(session_id)

Why they exist:
- conversation_id: fast per-conversation retrieval
- created_at: fast recent transcript queries
- user_id/session_id: analytics and session grouping queries

## Initialization Behavior
- Manual provisioning: run db/schema.sql in Neon SQL editor.
- Runtime provisioning: transcript logger can auto-create tables/indexes when first write occurs.

Recommended production practice:
- Use explicit migrations for schema governance.
- Keep db/schema.sql as canonical reference and bootstrap fallback.

## Common Queries
### Latest transcript events
```sql
select c.thread_id, m.user_id, m.session_id, m.role, m.model, m.latency_ms, m.created_at
from transcript_messages m
join conversations c on c.id = m.conversation_id
order by m.created_at desc
limit 50;
```

### Message volume by user
```sql
select user_id, count(*) as message_count
from transcript_messages
where user_id is not null
group by user_id
order by message_count desc
limit 20;
```

### Message volume by session
```sql
select session_id, count(*) as message_count
from transcript_messages
where session_id is not null
group by session_id
order by message_count desc
limit 20;
```

### Conversation count
```sql
select count(*) as conversations_total
from conversations;
```
