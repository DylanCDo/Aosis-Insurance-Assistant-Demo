"use server";

import OpenAI from "openai";
import { buildSalesSystemPrompt } from "./company-context";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAIResponse(
  input: string,
  threadId?: string
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

  const run = await client.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistantId,
    // Inject company persona, guardrails and enrollment CTA on every run
    additional_instructions: buildSalesSystemPrompt(),
  });

  if (run.status !== "completed") {
    return {
      content: "Sorry, I couldn't generate a response.",
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

  return {
    content: content || "Sorry, I couldn't generate a response.",
    threadId: thread.id,
  };
}
