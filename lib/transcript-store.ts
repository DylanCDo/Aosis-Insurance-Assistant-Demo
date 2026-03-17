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
