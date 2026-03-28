# Polly Module

## Overview

**File:** `lib/polly.ts`

This module is the server-side integration point for Amazon Polly. It accepts plain text plus a language code, synthesizes speech using the configured Polly voice, and returns the audio as a base64-encoded MP3 payload that can be safely passed back to the client.

The file is marked with `"use server"`, which ensures AWS credentials stay on the server and are never exposed to browser code.

## Responsibilities

- Define the supported Polly language union: `"en" | "es" | "vi"`
- Map each supported language to an Amazon Polly voice
- Map each supported language to a Polly engine
- Sanitize text before synthesis so URLs are not spoken aloud
- Send `SynthesizeSpeechCommand` requests to Amazon Polly
- Return audio as `{ audioBase64, contentType }`
- Throw explicit errors for empty input, failed Polly requests, or missing audio streams

## Public API

### `PollyLanguage`

```ts
export type PollyLanguage = "en" | "es" | "vi";
```

Restricts callers to the three supported language codes used by the chat UI.

### `synthesizeSpeech(text, language)`

```ts
export async function synthesizeSpeech(
  text: string,
  language: PollyLanguage
): Promise<{ audioBase64: string; contentType: string }>
```

#### Parameters

| Param | Type | Description |
| --- | --- | --- |
| `text` | `string` | The assistant message to synthesize |
| `language` | `PollyLanguage` | Selected chat language (`en`, `es`, or `vi`) |

#### Return value

| Field | Type | Description |
| --- | --- | --- |
| `audioBase64` | `string` | Base64-encoded MP3 bytes |
| `contentType` | `string` | MIME type returned by Polly, defaulting to `audio/mpeg` |

## Voice Configuration

| Language | Voice | Engine |
| --- | --- | --- |
| `en` | `Joanna` | `standard` |
| `es` | `Lucia` | `standard` |
| `vi` | `Linh` | `standard` |

These mappings are defined in:
- `voiceByLanguage`
- `engineByLanguage`

## Text Sanitization

Before sending content to Polly, the module runs it through `sanitize(input)`.

### Current behavior
- Removes `http://` and `https://` URLs
- Collapses repeated whitespace into single spaces
- Trims leading/trailing whitespace

This prevents Polly from reading raw URLs aloud and avoids awkward pauses caused by irregular whitespace.

## Request Flow

1. `synthesizeSpeech()` receives text and language.
2. `sanitize()` removes URLs and normalizes whitespace.
3. If the result is empty, the function throws `Cannot synthesize empty text.`
4. The module sends `SynthesizeSpeechCommand` with:
   - `OutputFormat: "mp3"`
   - `TextType: "text"`
   - `VoiceId` from `voiceByLanguage`
   - `Engine` from `engineByLanguage`
5. The returned `AudioStream` is converted to a byte array.
6. The bytes are encoded with `Buffer.from(audioBytes).toString("base64")`.
7. The function returns `{ audioBase64, contentType }`.

## Error Handling

The module wraps Polly failures in clearer application-level messages.

### Possible thrown errors
- `Cannot synthesize empty text.`
- `Amazon Polly request failed: ...`
- `Amazon Polly returned no audio stream.`

This keeps the client-facing hook logic simpler and makes debugging easier.

## Environment Variables

Required or supported by this module:

| Variable | Required | Notes |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | Yes | AWS credential |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS credential |
| `AWS_REGION` | No | Defaults to `us-east-1` |
| `AWS_SESSION_TOKEN` | No | Needed only for temporary credentials |

## Why Base64 Is Used

Polly returns a binary audio stream. This module converts that stream into base64 so it can be returned safely from a server function to client code without dealing with streaming binary transport in the React layer.

On the client side, `usePolly` decodes the base64 back into bytes, creates a Blob URL, and plays it through `HTMLAudioElement`.

## Consumers

Primary caller:
- `app/hooks/usePolly.ts`

That hook is responsible for:
- calling `synthesizeSpeech()`
- decoding the base64 MP3
- creating and revoking Blob URLs
- managing playback state and errors in the UI
