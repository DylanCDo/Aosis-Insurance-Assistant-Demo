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
        isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
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
          {sendLabel}
        </button>
      </div>
    </form>
  );
}
