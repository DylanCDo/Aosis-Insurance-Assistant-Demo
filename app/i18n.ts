import type { PageLanguage, UiText } from "./types";

export const localizedInitialGreeting: Record<PageLanguage, string> = {
  en: "Hi, I'm the AOSIS Smart Assistant! I'm here to help you find the right dental coverage. Ask me about our Cigna DHMO plans, pricing, and what's covered.",
  es: "Hola, ¡soy el asistente inteligente de AOSIS! Estoy aquí para ayudarle a encontrar la cobertura dental adecuada. Pregúnteme sobre nuestros planes, precios y qué cubre Cigna DHMO.",
  vi: "Xin chào, tôi là the AOSIS Smart Assistant. Tôi sẽ giúp bạn tìm bảo hiểm nha khoa phù hợp. Bạn có thể hỏi về gói Cigna DHMO, chi phí và quyền lợi.",
};

export const localizedUiText: Record<PageLanguage, UiText> = {
  en: {
    subtitle: "Ask about dental plan options, coverage, pricing, or enroll now.",
    languageLabel: "Language",
    voiceLabel: "Voice",
    voiceOn: "On",
    voiceOff: "Off",
    speak: "Speak",
    stop: "Stop",
    typing: "AOSIS Smart Assistant is typing...",
    placeholder: "Type your message...",
    send: "Send",
  },
  es: {
    subtitle:
      "Pregunta sobre opciones de planes dentales, cobertura, precios o inscripción.",
    languageLabel: "Idioma",
    voiceLabel: "Voz",
    voiceOn: "Activada",
    voiceOff: "Desactivada",
    speak: "Escuchar",
    stop: "Detener",
    typing: "AOSIS Smart Assistant esta escribiendo...",
    placeholder: "Escribe tu mensaje...",
    send: "Enviar",
  },
  vi: {
    subtitle:
      "Hỏi về các gói bảo hiểm nha khoa, quyền lợi, chi phí hoặc đăng ký ngay.",
    languageLabel: "Ngôn ngữ",
    voiceLabel: "Giọng nói",
    voiceOn: "Bật",
    voiceOff: "Tắt",
    speak: "Đọc",
    stop: "Dừng",
    typing: "AOSIS Smart Assistant đang trả lời...",
    placeholder: "Nhập tin nhắn...",
    send: "ửi",
  },
};
