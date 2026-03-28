export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type AnalyticsIds = {
  userId: string;
  sessionId: string;
};

export type PageLanguage = "en" | "es" | "vi";

export type UiText = {
  subtitle: string;
  languageLabel: string;
  voiceLabel: string;
  voiceOn: string;
  voiceOff: string;
  speak: string;
  stop: string;
  typing: string;
  placeholder: string;
  send: string;
};
