"use client";

import Image from "next/image";
import companyLogo from "../assets/AOSIS-logox2.png";
import type { PageLanguage, UiText } from "../types";

type Props = {
  isDark: boolean;
  language: PageLanguage;
  voiceEnabled: boolean;
  text: UiText;
  onLanguageChange: (lang: PageLanguage) => void;
  onVoiceToggle: () => void;
  onDarkToggle: () => void;
};

export function ChatHeader({
  isDark,
  language,
  voiceEnabled,
  text,
  onLanguageChange,
  onVoiceToggle,
  onDarkToggle,
}: Props) {
  return (
    <header
      className={`border-b px-5 py-4 sm:px-6 ${
        isDark
          ? "border-slate-700 bg-slate-900"
          : "border-blue-100 bg-white/90"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <a
            href="https://aosisolutions.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit AOSIS website"
            className="inline-flex"
          >
            <Image
              src={companyLogo}
              alt="AOSIS logo"
              className={`h-10 w-auto object-contain sm:h-12 ${
                isDark ? "invert" : ""
              }`}
              priority
            />
          </a>
          <div>
            <h1
              className={`text-xl font-semibold tracking-tight sm:text-2xl ${
                isDark ? "text-slate-100" : "text-blue-900"
              }`}
            >
              AOSIS Smart Assistant
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
            onChange={(e) => onLanguageChange(e.target.value as PageLanguage)}
            className={`rounded-xl border px-2 py-2 text-xs outline-none sm:text-sm ${
              isDark
                ? "border-slate-600 bg-slate-800 text-slate-100"
                : "border-blue-200 bg-white text-slate-700 focus:border-blue-400"
            }`}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="vi">Tiếng Việt</option>
          </select>

          <button
            type="button"
            onClick={onVoiceToggle}
            aria-label={`${text.voiceLabel}: ${voiceEnabled ? text.voiceOn : text.voiceOff}`}
            title={`${text.voiceLabel}: ${voiceEnabled ? text.voiceOn : text.voiceOff}`}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition sm:text-sm ${
              isDark
                ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                : "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100"
            }`}
          >
            {text.voiceLabel}: {voiceEnabled ? text.voiceOn : text.voiceOff}
          </button>

          <button
            type="button"
            onClick={onDarkToggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition sm:text-sm ${
              isDark
                ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                : "border-blue-200 bg-white text-blue-900 hover:bg-blue-50"
            }`}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {isDark ? "☀" : "☾"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
