import { sql } from "@vercel/postgres";

type TranscriptRole = "user" | "assistant" | "error";

type TranscriptMessage = {
  threadId: string;
  userId?: string;
  sessionId?: string;
  role: TranscriptRole;
  content: string;
  model?: string;
  latencyMs?: number;
  error?: string;
};

function isTranscriptLoggingConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL);
}

let schemaInitPromise: Promise<void> | null = null;

async function ensureTranscriptSchema(): Promise<void> {
  if (!isTranscriptLoggingConfigured()) return;
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS conversations (
          id BIGSERIAL PRIMARY KEY,
          thread_id TEXT NOT NULL UNIQUE,
          user_id TEXT,
          session_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS user_id TEXT
      `;

      await sql`
        ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS session_id TEXT
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS transcript_messages (
          id BIGSERIAL PRIMARY KEY,
          conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          user_id TEXT,
          session_id TEXT,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'error')),
          content TEXT NOT NULL,
          model TEXT,
          latency_ms INTEGER,
          error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        ALTER TABLE transcript_messages
        ADD COLUMN IF NOT EXISTS user_id TEXT
      `;

      await sql`
        ALTER TABLE transcript_messages
        ADD COLUMN IF NOT EXISTS session_id TEXT
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_transcript_messages_conversation_id
          ON transcript_messages(conversation_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_transcript_messages_created_at
          ON transcript_messages(created_at DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_transcript_messages_user_id
          ON transcript_messages(user_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_transcript_messages_session_id
          ON transcript_messages(session_id)
      `;
    })();
  }

  await schemaInitPromise;
}

async function ensureConversation(
  threadId: string,
  userId?: string,
  sessionId?: string
): Promise<number | null> {
  if (!isTranscriptLoggingConfigured()) return null;

  const result = await sql<{ id: number }>`
    INSERT INTO conversations (thread_id, user_id, session_id)
    VALUES (${threadId}, ${userId ?? null}, ${sessionId ?? null})
    ON CONFLICT (thread_id)
    DO UPDATE SET
      user_id = COALESCE(EXCLUDED.user_id, conversations.user_id),
      session_id = COALESCE(EXCLUDED.session_id, conversations.session_id)
    RETURNING id
  `;

  return result.rows[0]?.id ?? null;
}

export async function logTranscriptMessage(
  message: TranscriptMessage
): Promise<void> {
  if (!isTranscriptLoggingConfigured()) return;

  try {
    await ensureTranscriptSchema();

    const conversationId = await ensureConversation(
      message.threadId,
      message.userId,
      message.sessionId
    );
    if (!conversationId) return;

    await sql`
      INSERT INTO transcript_messages (
        conversation_id,
        user_id,
        session_id,
        role,
        content,
        model,
        latency_ms,
        error
      )
      VALUES (
        ${conversationId},
        ${message.userId ?? null},
        ${message.sessionId ?? null},
        ${message.role},
        ${message.content},
        ${message.model ?? null},
        ${message.latencyMs ?? null},
        ${message.error ?? null}
      )
    `;
  } catch (err) {
    // Best-effort logging. Chat responses should still succeed if logging fails.
    console.error("Transcript logging failed:", err);
  }
}
