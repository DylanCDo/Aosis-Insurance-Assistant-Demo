CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  thread_id TEXT NOT NULL UNIQUE,
  user_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
);

CREATE INDEX IF NOT EXISTS idx_transcript_messages_conversation_id
  ON transcript_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_transcript_messages_created_at
  ON transcript_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcript_messages_user_id
  ON transcript_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_transcript_messages_session_id
  ON transcript_messages(session_id);
