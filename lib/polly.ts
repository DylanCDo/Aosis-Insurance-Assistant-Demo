"use server";

import {
  PollyClient,
  SynthesizeSpeechCommand,
  type VoiceId,
} from "@aws-sdk/client-polly";

export type PollyLanguage = "en" | "es" | "vi";

const voiceByLanguage: Record<PollyLanguage, string> = {
  en: "Joanna",
  es: "Lucia",
  vi: "Linh",
};

const engineByLanguage: Record<PollyLanguage, "neural" | "standard"> = {
  en: "standard",
  es: "standard",
  vi: "standard",
};

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

/** Strip URLs and collapse whitespace so Polly reads only the plain text. */
function sanitize(input: string): string {
  return input
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Synthesizes the given text via Amazon Polly and returns the audio as a
 * base64-encoded MP3 string so it can be safely transferred to the client.
 *
 * Required environment variables:
 *   AWS_REGION            (defaults to us-east-1)
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_SESSION_TOKEN     (optional — only needed for temporary credentials)
 */
export async function synthesizeSpeech(
  text: string,
  language: PollyLanguage
): Promise<{ audioBase64: string; contentType: string }> {
  const sanitizedText = sanitize(text);

  if (!sanitizedText) {
    throw new Error("Cannot synthesize empty text.");
  }

  let response;
  try {
    response = await pollyClient.send(
      new SynthesizeSpeechCommand({
        OutputFormat: "mp3",
        Text: sanitizedText,
        TextType: "text",
        VoiceId: voiceByLanguage[language] as VoiceId,
        Engine: engineByLanguage[language],
      })
    );
  } catch (err) {
    throw new Error(
      "Amazon Polly request failed: " +
        (err instanceof Error ? err.message : String(err))
    );
  }

  if (!response.AudioStream) {
    throw new Error("Amazon Polly returned no audio stream.");
  }

  const audioBytes = await response.AudioStream.transformToByteArray();
  const audioBase64 = Buffer.from(audioBytes).toString("base64");

  return {
    audioBase64,
    contentType: response.ContentType ?? "audio/mpeg",
  };
}
