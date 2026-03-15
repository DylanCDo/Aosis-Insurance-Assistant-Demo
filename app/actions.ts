"use server";

import OpenAI from "openai";
import { buildSalesSystemPrompt } from "./company-context";

export async function getAIResponse(input: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to ai-test/.env.local and restart the dev server.",
    );
  }

  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: buildSalesSystemPrompt(),
      },
      {
        role: "user",
        content: input,
      },
    ],
  });

  return (
    response.choices[0]?.message?.content ||
    "Sorry, I couldn't generate a response."
  );
}
