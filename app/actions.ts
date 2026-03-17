"use server";

import OpenAI from "openai";
import { buildSalesSystemPrompt } from "./company-context";
import { logTranscriptMessage } from "../lib/transcript-store";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL_NAME = "gpt-4o";

export async function getAIResponse(
  input: string,
  threadId?: string,
  analytics?: { userId?: string; sessionId?: string }
): Promise<{ content: string; threadId: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to .env.local and restart the dev server."
    );
  }

  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  if (!assistantId) {
    throw new Error(
      "Missing OPENAI_ASSISTANT_ID. Run `npm run setup-assistant` first, then add the printed ID to .env.local."
    );
  }

  // Reuse an existing conversation thread or start a new one
  const thread = threadId
    ? { id: threadId }
    : await client.beta.threads.create();

  await client.beta.threads.messages.create(thread.id, {
    role: "user",
    content: input,
  });

  await logTranscriptMessage({
    threadId: thread.id,
    userId: analytics?.userId,
    sessionId: analytics?.sessionId,
    role: "user",
    content: input,
  });

  const startTime = Date.now();

  const run = await client.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistantId,
    // Inject company persona, guardrails and enrollment CTA on every run
    additional_instructions: buildSalesSystemPrompt(),
  });

  if (run.status !== "completed") {
    const fallback = "Sorry, I couldn't generate a response.";
    await logTranscriptMessage({
      threadId: thread.id,
      userId: analytics?.userId,
      sessionId: analytics?.sessionId,
      role: "error",
      content: fallback,
      model: MODEL_NAME,
      latencyMs: Date.now() - startTime,
      error: `run_status_${run.status}`,
    });

    return {
      content: fallback,
      threadId: thread.id,
    };
  }

  const messages = await client.beta.threads.messages.list(thread.id, {
    order: "desc",
    limit: 1,
  });

  const message = messages.data[0];
  const content = message.content
    .filter(
      (block): block is OpenAI.Beta.Threads.TextContentBlock =>
        block.type === "text"
    )
    // Strip citation annotations like 【4:0†source】 for clean output
    .map((block) => block.text.value.replace(/【[^】]+】/g, "").trim())
    .join("\n");

  const finalContent = content || "Sorry, I couldn't generate a response.";

  await logTranscriptMessage({
    threadId: thread.id,
    userId: analytics?.userId,
    sessionId: analytics?.sessionId,
    role: "assistant",
    content: finalContent,
    model: MODEL_NAME,
    latencyMs: Date.now() - startTime,
  });

  return {
    content: finalContent,
    threadId: thread.id,
  };
}
