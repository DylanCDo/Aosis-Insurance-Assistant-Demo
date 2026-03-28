# MessageList

**Source component:** `app/components/MessageList.tsx`

## Overview

`MessageList` renders the scrollable area containing all chat messages and the typing indicator.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `messages` | `ChatMessage[]` | All chat messages to display |
| `loading` | `boolean` | Whether the assistant is currently generating a response |
| `isDark` | `boolean` | Whether dark mode is active |
| `speakingId` | `string \| null` | ID of the message currently being spoken aloud |
| `ttsLoading` | `boolean` | Whether a Polly request is in-flight |
| `ttsErrorId` | `string \| null` | ID of the message that last failed TTS |
| `text` | `UiText` | Localized label strings |
| `endRef` | `RefObject<HTMLDivElement \| null>` | Ref passed to the scroll anchor div |
| `onSpeak` | `(message: ChatMessage) => void` | Called when the Speak button is clicked |
| `onStop` | `() => void` | Called when the Stop button is clicked |
| `onClearError` | `(id: string) => void` | Called when the TTS error label is clicked |

## Renders

- A `MessageBubble` for each message in `messages`
- A typing indicator div when `loading` is true
- An invisible scroll anchor div at the bottom (via `endRef`)

## Notes

This component coordinates message rendering but does not own the message array or playback state. It depends on parent-provided props for all behavior.