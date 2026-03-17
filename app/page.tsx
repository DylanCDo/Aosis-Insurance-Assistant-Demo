"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getAIResponse } from "./actions";
import companyLogo from "./assets/AOSIS-logox2.png";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type PageLanguage = "en" | "es" | "vi";

const localizedInitialGreeting: Record<PageLanguage, string> = {
  en: "Hi, I'm the Aosis Smart Assistant! I'm here to help you find the right dental coverage. Ask me about our Cigna DHMO plans, pricing, and what's covered.",
  es: "Hola, ¡soy el asistente inteligente de Aosis! Estoy aquí para ayudarle a encontrar la cobertura dental adecuada. Pregúnteme sobre nuestros planes, precios y qué cubre Cigna DHMO.",
  vi: "Xin chào, tôi là the Aosis Smart Assistant. Tôi sẽ giúp bạn tìm bảo hiểm nha khoa phù hợp. Bạn có thể hỏi về gói Cigna DHMO, chi phí và quyền lợi.",
};

const localizedUiText: Record<
  PageLanguage,
  {
    subtitle: string;
    languageLabel: string;
    typing: string;
    placeholder: string;
    send: string;
  }
> = {
  en: {
    subtitle: "Ask about dental plan options, coverage, pricing, or enroll now.",
    languageLabel: "Language",
    typing: "Aosis Smart Assistant is typing...",
    placeholder: "Type your message...",
    send: "Send",
  },
  es: {
    subtitle:
      "Pregunta sobre opciones de planes dentales, cobertura, precios o inscripción.",
    languageLabel: "Idioma",
    typing: "Aosis Smart Assistant esta escribiendo...",
    placeholder: "Escribe tu mensaje...",
    send: "Enviar",
  },
  vi: {
    subtitle:
      "Hỏi về các gói bảo hiểm nha khoa, quyền lợi, chi phí hoặc đăng ký ngay.",
    languageLabel: "Ngôn ngữ",
    typing: "Aosis Smart Assistant đang trả lời...",
    placeholder: "Nhập tin nhắn...",
    send: "ửi",
  },
};

export default function Home() {
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<PageLanguage>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: localizedInitialGreeting.en,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const text = localizedUiText[language];

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;

      const first = prev[0];
      if (first.role !== "assistant") return prev;

      const isInitialGreeting = Object.values(localizedInitialGreeting).includes(
        first.content
      );
      if (!isInitialGreeting) return prev;

      const next = [...prev];
      next[0] = {
        ...first,
        content: localizedInitialGreeting[language],
      };
      return next;
    });
  }, [language]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const userMessage = input.trim();
    if (!userMessage || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const result = await getAIResponse(userMessage, threadId);
      setThreadId(result.threadId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.content || "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Error: " + (err instanceof Error ? err.message : String(err)),
        },
      ]);
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
        <header
          className={`border-b px-5 py-4 sm:px-6 ${
            isDark
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Image
                src={companyLogo}
                alt="AOSIS logo"
                className={`h-10 w-auto object-contain sm:h-12 ${
                  isDark ? "invert" : ""
                }`}
                priority
              />
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Aosis Smart Assistant
                </h1>
                <p
                  className={`mt-1 text-sm ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {text.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="page-language" className="sr-only">
                {text.languageLabel}
              </label>
              <select
                id="page-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as PageLanguage)}
                className={`rounded-xl border px-2 py-2 text-xs outline-none sm:text-sm ${
                  isDark
                    ? "border-slate-600 bg-slate-800 text-slate-100"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="vi">Tiếng Việt</option>
              </select>

              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition sm:text-sm ${
                  isDark
                    ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {isDark ? "☀" : "☾"}
                </span>
              </button>
            </div>
          </div>
        </header>

        <section
          className={`flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 ${
            isDark ? "bg-slate-900/70" : "bg-slate-100/70"
          }`}
        >
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                    isUser
                      ? isDark
                        ? "rounded-br-md bg-slate-100 text-slate-900"
                        : "rounded-br-md bg-slate-900 text-white"
                      : isDark
                        ? "rounded-bl-md border border-slate-700 bg-slate-800 text-slate-100"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

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

          <div ref={endOfMessagesRef} />
        </section>

        <form
          onSubmit={handleSubmit}
          className={`border-t p-4 sm:p-5 ${
            isDark
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-end gap-3">
            <textarea
              id="user-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={text.placeholder}
              rows={2}
              className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                isDark
                  ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-slate-500"
                  : "border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-400 focus:bg-white"
              }`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`rounded-2xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isDark
                  ? "bg-slate-100 text-slate-900 hover:bg-slate-300"
                  : "bg-slate-900 text-white hover:bg-slate-700"
              }`}
            >
              {text.send}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
