# MessageBubble

**Source component:** `app/components/MessageBubble.tsx`

## Overview

`MessageBubble` renders a single chat message bubble and, for assistant messages, the Speak/Stop button and optional error label.

It also contains the `renderMessageContent()` helper, which detects URLs in message text and converts them into safe `<a>` links.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `message` | `ChatMessage` | The message to display |
| `isDark` | `boolean` | Whether dark mode is active |
| `isSpeaking` | `boolean` | Whether this specific message is currently being spoken |
| `ttsLoading` | `boolean` | Whether a Polly request is in-flight (used to disable the speak button) |
| `ttsErrorId` | `string \| null` | ID of the message with a TTS error (used to show error label) |
| `speakLabel` | `string` | Localized label for the Speak button |
| `stopLabel` | `string` | Localized label for the Stop button |
| `onSpeak` | `(message: ChatMessage) => void` | Called when Speak is clicked |
| `onStop` | `() => void` | Called when Stop is clicked |
| `onClearError` | `(id: string) => void` | Called when the error label is clicked |

## Renders

- User messages: right-aligned, dark/light background
- Assistant messages: left-aligned, bordered card
- URLs in content are rendered as safe `target="_blank" rel="noopener noreferrer"` links
- Speak/Stop button below each assistant message
- `Voice unavailable — check AWS credentials` error text when TTS fails (dismissible on click)

## Notes

This component contains the message-level link parsing and the message-level TTS controls, but it does not own playback state. The parent decides whether the bubble is currently speaking.