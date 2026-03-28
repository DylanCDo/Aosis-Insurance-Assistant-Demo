"use client";

import type { ReactNode } from "react";
import type { ChatMessage } from "../types";

const urlRegex = /https?:\/\/[^\s]+/g;

function renderMessageContent(content: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of content.matchAll(urlRegex)) {
    if (!match[0] || match.index === undefined) continue;

    const start = match.index;
    const end = start + match[0].length;

    if (start > cursor) {
      parts.push(content.slice(cursor, start));
    }

    const rawUrl = match[0];
    const trimmedUrl = rawUrl.replace(/[),.;!?]+$/g, "");
    const trailingText = rawUrl.slice(trimmedUrl.length);
    const isSafeProtocol = /^https?:\/\//i.test(trimmedUrl);

    if (trimmedUrl && isSafeProtocol) {
      parts.push(
        <a
          key={`link-${start}`}
          href={trimmedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-2 hover:opacity-80"
        >
          {trimmedUrl}
        </a>
      );
    } else {
      parts.push(rawUrl);
    }

    if (trailingText) {
      parts.push(trailingText);
    }

    cursor = end;
  }

  if (cursor < content.length) {
    parts.push(content.slice(cursor));
  }

  return parts.length > 0 ? parts : [content];
}

type Props = {
  message: ChatMessage;
  isDark: boolean;
  isSpeaking: boolean;
  ttsLoading: boolean;
  ttsErrorId: string | null;
  speakLabel: string;
  stopLabel: string;
  onSpeak: (message: ChatMessage) => void;
  onStop: () => void;
  onClearError: (id: string) => void;
};

export function MessageBubble({
  message,
  isDark,
  isSpeaking,
  ttsLoading,
  ttsErrorId,
  speakLabel,
  stopLabel,
  onSpeak,
  onStop,
  onClearError,
}: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
            isUser
              ? isDark
                ? "rounded-br-md bg-slate-100 text-slate-900"
                : "rounded-br-md bg-slate-900 text-white"
              : isDark
                ? "rounded-bl-md border border-slate-700 bg-slate-800 text-slate-100"
                : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {renderMessageContent(message.content)}
        </div>

        {!isUser ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  onStop();
                } else {
                  onSpeak(message);
                }
              }}
              disabled={ttsLoading && !isSpeaking}
              className={`rounded-xl border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {isSpeaking ? stopLabel : speakLabel}
            </button>

            {ttsErrorId === message.id ? (
              <span
                className="cursor-pointer text-xs text-red-500"
                title="Click to dismiss"
                onClick={() => onClearError(message.id)}
              >
                Voice unavailable — check AWS credentials
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
