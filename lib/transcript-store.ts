import { sql } from "@vercel/postgres";

type TranscriptRole = "user" | "assistant" | "error";

type TranscriptMessage = {
  threadId: string;
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
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS transcript_messages (
          id BIGSERIAL PRIMARY KEY,
          conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'error')),
          content TEXT NOT NULL,
          model TEXT,
          latency_ms INTEGER,
          error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_transcript_messages_conversation_id
          ON transcript_messages(conversation_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_transcript_messages_created_at
          ON transcript_messages(created_at DESC)
      `;
    })();
  }

  await schemaInitPromise;
}

async function ensureConversation(threadId: string): Promise<number | null> {
  if (!isTranscriptLoggingConfigured()) return null;

  const result = await sql<{ id: number }>`
    INSERT INTO conversations (thread_id)
    VALUES (${threadId})
    ON CONFLICT (thread_id)
    DO UPDATE SET thread_id = EXCLUDED.thread_id
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

    const conversationId = await ensureConversation(message.threadId);
    if (!conversationId) return;

    await sql`
      INSERT INTO transcript_messages (
        conversation_id,
        role,
        content,
        model,
        latency_ms,
        error
      )
      VALUES (
        ${conversationId},
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
