"use client";

import type { FormEvent } from "react";

type Props = {
  input: string;
  loading: boolean;
  isDark: boolean;
  placeholder: string;
  sendLabel: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ChatInput({
  input,
  loading,
  isDark,
  placeholder,
  sendLabel,
  onChange,
  onSubmit,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className={`border-t p-4 sm:p-5 ${
        isDark
          ? "border-slate-700 bg-slate-900"
          : "border-blue-100 bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="flex items-end gap-3">
        <textarea
          id="user-input"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSubmit(e as unknown as FormEvent);
            }
          }}
          placeholder={placeholder}
          rows={2}
          className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition ${
            isDark
              ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-slate-500"
              : "border-blue-200 bg-white text-slate-900 focus:border-blue-500"
          }`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`rounded-2xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
            isDark
              ? "bg-blue-100 text-blue-950 hover:bg-blue-50"
              : "bg-blue-700 text-white hover:bg-blue-600"
          }`}
        >
          {sendLabel}
        </button>
      </div>
    </form>
  );
}
