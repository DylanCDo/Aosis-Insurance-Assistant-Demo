"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getAIResponse, translateMessages } from "./actions";
import { localizedInitialGreeting, localizedUiText } from "./i18n";
import type { AnalyticsIds, ChatMessage, PageLanguage } from "./types";
import { usePolly } from "./hooks/usePolly";
import { ChatHeader } from "./components/ChatHeader";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";

export default function Home() {
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<PageLanguage>("en");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const greetingShownRef = useRef(false);
  const prevLanguageRef = useRef<PageLanguage>(language);
  const languageRef = useRef(language);
  const voiceEnabledRef = useRef(voiceEnabled);
  const messagesRef = useRef<ChatMessage[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const text = localizedUiText[language];

  const {
    speakingId,
    ttsLoading,
    ttsErrorId,
    stopPlayback,
    clearTtsError,
    playNotificationSound,
    playAudio,
  } = usePolly(language);

  function makeMessage(role: ChatMessage["role"], content: string): ChatMessage {
    return { id: window.crypto.randomUUID(), role, content };
  }

  function getOrCreateAnalyticsIds(): AnalyticsIds | undefined {
    if (typeof window === "undefined") return undefined;

    const userStorageKey = "aosis-user-id";
    const sessionStorageKey = "aosis-session-id";

    let userId = window.localStorage.getItem(userStorageKey);
    if (!userId) {
      userId = window.crypto.randomUUID();
      window.localStorage.setItem(userStorageKey, userId);
    }

    let sessionId = window.sessionStorage.getItem(sessionStorageKey);
    if (!sessionId) {
      sessionId = window.crypto.randomUUID();
      window.sessionStorage.setItem(sessionStorageKey, sessionId);
    }

    return { userId, sessionId };
  }

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!voiceEnabled) stopPlayback();
  }, [voiceEnabled]);

  useEffect(() => () => stopPlayback(), []);

  useEffect(() => {
    if (greetingShownRef.current) return;
    greetingShownRef.current = true;
    setLoading(true);
    const timer = setTimeout(() => {
      const currentLanguage = languageRef.current;
      const greeting: ChatMessage = {
        id: "assistant-initial",
        role: "assistant",
        content: localizedInitialGreeting[currentLanguage],
      };
      setMessages([greeting]);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevLanguageRef.current === language) return;
    prevLanguageRef.current = language;

    // Swap the greeting immediately using the hardcoded translation
    setMessages((prev) =>
      prev.map((m) =>
        m.id === "assistant-initial"
          ? { ...m, content: localizedInitialGreeting[language] }
          : m
      )
    );

    // Translate all other messages via OpenAI
    const toTranslate = messagesRef.current
      .filter((m) => m.role === "assistant" && m.id !== "assistant-initial")
      .map((m) => ({ id: m.id, content: m.content }));

    if (toTranslate.length === 0) return;

    setIsTranslating(true);
    translateMessages(toTranslate, language)
      .then((translated) => {
        const map = new Map(translated.map((t) => [t.id, t.content]));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === "assistant-initial"
              ? m
              : { ...m, content: map.get(m.id) ?? m.content }
          )
        );
      })
      .catch(() => {})
      .finally(() => setIsTranslating(false));
  }, [language]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const userMessage = input.trim();
    if (!userMessage || loading) return;

    setMessages((prev) => [...prev, makeMessage("user", userMessage)]);
    setInput("");
    setLoading(true);

    try {
      const analyticsIds = getOrCreateAnalyticsIds();
      const result = await getAIResponse(userMessage, threadId, analyticsIds);
      setThreadId(result.threadId);
      const reply = makeMessage(
        "assistant",
        result.content || "Sorry, I couldn't generate a response."
      );
      setMessages((prev) => [...prev, reply]);
      playNotificationSound();
      if (voiceEnabled) {
        playAudio(reply);
      }
    } catch (err) {
      const reply = makeMessage(
        "assistant",
        "Error: " + (err instanceof Error ? err.message : String(err))
      );
      setMessages((prev) => [...prev, reply]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`h-screen w-screen ${
        isDark
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100"
          : "bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900"
      }`}
    >
      <main
        className={`flex h-full w-full flex-col overflow-hidden ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}
      >
        <ChatHeader
          isDark={isDark}
          language={language}
          voiceEnabled={voiceEnabled}
          text={text}
          onLanguageChange={setLanguage}
          onVoiceToggle={() => setVoiceEnabled((prev) => !prev)}
          onDarkToggle={() => setIsDark((prev) => !prev)}
        />

        <MessageList
          messages={messages}
          loading={loading}
          isDark={isDark}
          speakingId={speakingId}
          ttsLoading={ttsLoading}
          ttsErrorId={ttsErrorId}
          text={text}
          endRef={endOfMessagesRef}
          onSpeak={(msg) => { clearTtsError(msg.id); void playAudio(msg); }}
          onStop={stopPlayback}
          onClearError={clearTtsError}
        />

        <ChatInput
          input={input}
          loading={loading || isTranslating}
          isDark={isDark}
          placeholder={text.placeholder}
          sendLabel={text.send}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}