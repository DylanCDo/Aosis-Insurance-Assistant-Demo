import { useRef, useState } from "react";
import { synthesizeSpeech, type PollyLanguage } from "../../lib/polly";
import type { ChatMessage } from "../types";

export function usePolly(language: PollyLanguage) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsErrorId, setTtsErrorId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const playRequestIdRef = useRef(0);

  function stopPlayback() {
    playRequestIdRef.current += 1;
    if (activeAudioRef.current) {
      activeAudioRef.current.onended = null;
      activeAudioRef.current.onerror = null;
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if (activeAudioUrlRef.current) {
      URL.revokeObjectURL(activeAudioUrlRef.current);
      activeAudioUrlRef.current = null;
    }
    setSpeakingId(null);
    setTtsLoading(false);
  }

  function clearTtsError(messageId: string) {
    setTtsErrorId((prev) => (prev === messageId ? null : prev));
  }

  function playNotificationSound() {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.25);
      oscillator.onended = () => ctx.close();
    } catch {
      // AudioContext not available
    }
  }

  async function playAudio(message: ChatMessage) {
    if (message.role !== "assistant") return;

    // Stop any in-flight playback first — this increments the ref
    stopPlayback();
    // Capture the ref value AFTER stopping so the stale-check works correctly
    const requestId = playRequestIdRef.current;
    setTtsLoading(true);
    setSpeakingId(message.id);

    try {
      const result = await synthesizeSpeech(
        message.content,
        language as PollyLanguage
      );
      if (playRequestIdRef.current !== requestId) return;

      const bytes = Uint8Array.from(atob(result.audioBase64), (c) =>
        c.charCodeAt(0)
      );
      const url = URL.createObjectURL(
        new Blob([bytes], { type: result.contentType })
      );
      const audio = new Audio(url);

      activeAudioUrlRef.current = url;
      activeAudioRef.current = audio;

      const cleanup = () => {
        if (activeAudioUrlRef.current) {
          URL.revokeObjectURL(activeAudioUrlRef.current);
          activeAudioUrlRef.current = null;
        }
        activeAudioRef.current = null;
        setSpeakingId(null);
      };
      audio.onended = cleanup;
      audio.onerror = () => {
        cleanup();
        setTtsErrorId(message.id);
      };

      await audio.play();
    } catch (err) {
      console.error("Polly playback error:", err);
      setSpeakingId(null);
      if (playRequestIdRef.current === requestId) setTtsErrorId(message.id);
    } finally {
      if (playRequestIdRef.current === requestId) setTtsLoading(false);
    }
  }

  return {
    speakingId,
    ttsLoading,
    ttsErrorId,
    stopPlayback,
    clearTtsError,
    playNotificationSound,
    playAudio,
  };
}
