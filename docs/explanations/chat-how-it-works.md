# How The Chat Works

## Overview

This chat is a Next.js App Router application that combines three main systems:

- OpenAI Assistants API for generating answers
- Amazon Polly for text-to-speech playback
- Neon/Postgres for transcript logging

At a high level, the browser renders the chat UI, sends user messages to a server action, receives the assistant's reply, displays it in the thread, optionally plays audio for it, and logs the conversation in the background.

## What The User Sees

When the page opens:

1. The chat shows a short typing delay.
2. An initial greeting message appears.
3. The user can type a message or switch language, voice, and theme settings.

When the user sends a message:

1. The message is added to the UI immediately.
2. The assistant shows a typing state while the response is being generated.
3. The assistant response appears in the chat.
4. A short notification sound plays.
5. If voice is enabled, Amazon Polly generates speech and the reply is played aloud.

## End-To-End Message Flow

### 1. User input starts in the browser

The main page component in `app/page.tsx` holds the chat state:

- `messages`
- `threadId`
- `input`
- `loading`
- `language`
- `voiceEnabled`
- `isDark`
- `isTranslating`

When the user presses Enter or clicks Send, `handleSubmit()` runs.

### 2. The UI appends the user message immediately

Before waiting for the server, the client adds the user's message to the local `messages` array. This makes the UI feel responsive and ensures the user sees their own message right away.

### 3. The client calls the server action

`app/page.tsx` calls:

```ts
getAIResponse(userMessage, threadId, analyticsIds)
```

This sends the current message plus the existing thread ID and analytics IDs to the server.

### 4. The server action talks to OpenAI

The server-side logic lives in `app/actions.ts`.

`getAIResponse()` does the following:

1. Validates required environment variables.
2. Creates a new OpenAI thread or reuses the existing one.
3. Appends the user message to that thread.
4. Logs the user message to transcript storage.
5. Runs the assistant with `buildSalesSystemPrompt()` as additional instructions.
6. Fetches the newest assistant reply.
7. Strips citation markers from the returned text.
8. Logs the assistant reply.
9. Returns `{ content, threadId }` to the client.

This is what gives the chat continuity across multiple turns: the same OpenAI thread is reused for follow-up questions.

### 5. The client renders the assistant response

Once the server returns, the client:

1. Saves the returned `threadId`
2. Creates a new assistant message object
3. Appends it to `messages`
4. Plays the message notification sound
5. Starts text-to-speech if voice is enabled

## How Language Switching Works

The language dropdown affects both the UI text and assistant message translation.

### UI labels

Static UI labels come from `app/i18n.ts`, including:

- button labels
- placeholder text
- typing indicator text
- the intro greeting

### Existing assistant replies

When the language changes, `app/page.tsx`:

1. swaps the intro greeting immediately from `app/i18n.ts`
2. collects existing assistant messages except the intro greeting
3. sends them to `translateMessages()` in `app/actions.ts`
4. replaces their text in-place when the translated batch returns

User messages are not translated. Only assistant replies are translated.

## How Text-To-Speech Works

Client-side playback behavior is managed in `app/hooks/usePolly.ts`.

### What `usePolly` does

The hook manages:

- which message is currently speaking
- whether a Polly request is loading
- which message has a TTS error
- stopping current playback safely
- playing the notification sound
- calling the server-side Polly module and playing the result

### Server-side Polly request

The actual Polly integration lives in `lib/polly.ts`.

`synthesizeSpeech(text, language)`:

1. sanitizes the text
2. removes URLs so Polly does not read raw links aloud
3. sends a `SynthesizeSpeechCommand` to Amazon Polly
4. converts the returned audio stream to base64
5. returns `{ audioBase64, contentType }`

### Client-side audio playback

After the client receives the base64 audio:

1. it decodes the bytes
2. creates a `Blob`
3. creates a temporary object URL
4. assigns that URL to an `Audio` element
5. plays the sound in the browser
6. revokes the object URL when playback ends

This keeps AWS credentials on the server while still allowing browser playback.

## How Transcript Logging Works

Transcript persistence is handled by `lib/transcript-store.ts` and documented in `docs/lib/transcript-store.md`.

Logging is best-effort:

- if logging works, messages are stored in Neon/Postgres
- if logging fails, the chat still continues to work

Two kinds of records are stored:

- conversation-level rows
- message-level transcript rows

This makes it possible to review usage, debug behavior, and analyze chat sessions later.

## Component Structure

The UI is split into focused React components:

- `ChatHeader` — header controls for language, voice, and theme
- `MessageList` — scrollable message area and typing indicator
- `MessageBubble` — individual message rendering and speak/stop UI
- `ChatInput` — textarea and send button

The page component coordinates these pieces, but the rendering details are delegated to smaller components for maintainability.

## Error Handling Behavior

The chat has a few layers of fault tolerance:

- Missing OpenAI configuration throws explicit server-side errors
- Failed assistant runs return a fallback assistant message
- Polly failures show an inline voice error on the affected message
- Transcript logging failures do not block chat responses
- Empty text is rejected before a Polly request is sent

## Summary

The chat works by combining:

- a browser-based React UI for interaction
- a server action that manages OpenAI threads and responses
- a server-side Polly module for speech synthesis
- a client-side hook for audio playback
- a transcript persistence layer for logging

That separation keeps the system easier to reason about:

- UI concerns stay in components
- orchestration stays in `app/page.tsx`
- OpenAI interaction stays in `app/actions.ts`
- Polly synthesis stays in `lib/polly.ts`
- playback state stays in `app/hooks/usePolly.ts`
- persistence stays in `lib/transcript-store.ts`