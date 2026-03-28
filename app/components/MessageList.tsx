"use client";

import type { RefObject } from "react";
import type { ChatMessage, UiText } from "../types";
import { MessageBubble } from "./MessageBubble";

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  isDark: boolean;
  speakingId: string | null;
  ttsLoading: boolean;
  ttsErrorId: string | null;
  text: UiText;
  endRef: RefObject<HTMLDivElement | null>;
  onSpeak: (message: ChatMessage) => void;
  onStop: () => void;
  onClearError: (id: string) => void;
};

export function MessageList({
  messages,
  loading,
  isDark,
  speakingId,
  ttsLoading,
  ttsErrorId,
  text,
  endRef,
  onSpeak,
  onStop,
  onClearError,
}: Props) {
  return (
    <section
      className={`flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 ${
        isDark ? "bg-slate-900/70" : "bg-slate-100/70"
      }`}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isDark={isDark}
          isSpeaking={speakingId === message.id}
          ttsLoading={ttsLoading}
          ttsErrorId={ttsErrorId}
          speakLabel={text.speak}
          stopLabel={text.stop}
          onSpeak={onSpeak}
          onStop={onStop}
          onClearError={onClearError}
        />
      ))}

      {loading ? (
        <div className="flex justify-start">
          <div
            className={`rounded-2xl rounded-bl-md border px-4 py-3 text-sm ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-300"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {text.typing}
          </div>
        </div>
      ) : null}

      <div ref={endRef} />
    </section>
  );
}
