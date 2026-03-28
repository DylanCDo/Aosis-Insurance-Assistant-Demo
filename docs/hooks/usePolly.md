# Custom Hooks

All custom hooks live in `app/hooks/`. They encapsulate stateful logic that would otherwise clutter page-level components.

---

## usePolly

**File:** `app/hooks/usePolly.ts`

Manages all Amazon Polly text-to-speech state and audio playback for the chat. Called once in `app/page.tsx` and its return values are passed down to components as needed.

### Signature

```ts
function usePolly(language: PollyLanguage): {
  speakingId: string | null;
  ttsLoading: boolean;
  ttsErrorId: string | null;
  stopPlayback: () => void;
  clearTtsError: (messageId: string) => void;
  playNotificationSound: () => void;
  playAudio: (message: ChatMessage) => Promise<void>;
}
```

### Parameters

| Param | Type | Description |
| --- | --- | --- |
| `language` | `PollyLanguage` | Active language (`"en" \| "es" \| "vi"`). Determines the Polly voice used. |

### Return Values

| Value | Type | Description |
| --- | --- | --- |
| `speakingId` | `string \| null` | The `id` of the message currently being spoken. `null` when idle. |
| `ttsLoading` | `boolean` | `true` while a Polly synthesis request is in-flight. |
| `ttsErrorId` | `string \| null` | The `id` of the last message that failed TTS. `null` when no error. |
| `stopPlayback` | `() => void` | Stops and cleans up any active audio immediately. |
| `clearTtsError` | `(id: string) => void` | Dismisses the error state for a specific message. |
| `playNotificationSound` | `() => void` | Plays a short descending tone via the Web Audio API. |
| `playAudio` | `(message: ChatMessage) => Promise<void>` | Synthesizes and plays a message via Polly. |

---

### Internal Design

#### State
- `speakingId` — tracks which message bubble shows the Stop button
- `ttsLoading` — disables Speak buttons on other messages while one is loading
- `ttsErrorId` — surfaces an inline error on the specific message that failed

#### Refs
- `activeAudioRef` — holds the current `HTMLAudioElement` so it can be stopped
- `activeAudioUrlRef` — holds the blob URL so it can be revoked and memory freed
- `playRequestIdRef` — integer counter incremented on every `stopPlayback()` call

#### Race Condition Protection
When the user clicks Speak on a new message while one is already playing:
1. `stopPlayback()` is called first, incrementing `playRequestIdRef`
2. The current value of `playRequestIdRef` is captured as `requestId`
3. After the async `synthesizeSpeech()` call returns, the ref is checked again
4. If the ref no longer matches `requestId`, the response is discarded silently

This prevents stale Polly responses from playing over newer requests.

#### False Error Prevention
Calling `audio.src = ""` to stop the browser audio element triggers the element's `onerror` event. To prevent this from showing "Voice unavailable" falsely, `stopPlayback()` nulls `audio.onended` and `audio.onerror` **before** clearing the src.

#### Notification Sound
`playNotificationSound()` uses the Web Audio API (`AudioContext`) to synthesize a short tone entirely in-browser — no audio file required. The tone descends from 880Hz to 660Hz over 0.25 seconds at low gain. The `AudioContext` is created fresh on each call and closed when the oscillator finishes to avoid resource leaks.

#### Memory Management
- Blob URLs are created from decoded base64 Polly audio
- Each URL is stored in `activeAudioUrlRef` and revoked (`URL.revokeObjectURL`) as soon as playback ends or is stopped
- `AudioContext` instances used for notification sounds are closed in their `onended` callback

---

### Voice and Engine Map

Defined in `lib/polly.ts` (server-side):

| Language | Voice  | Engine   |
| -------- | ------ | -------- |
| `en`     | Joanna | standard |
| `es`     | Lucia  | standard |
| `vi`     | Linh   | standard |

Vietnamese (Linh) does not support the neural engine. If neural quality is desired for English or Spanish, change the engine map in `lib/polly.ts`.
