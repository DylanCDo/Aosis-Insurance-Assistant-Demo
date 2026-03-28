# ChatHeader

**Source component:** `app/components/ChatHeader.tsx`

## Overview

`ChatHeader` renders the top header bar of the chat interface.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `isDark` | `boolean` | Whether dark mode is active |
| `language` | `PageLanguage` | Currently selected language (`"en" \| "es" \| "vi"`) |
| `voiceEnabled` | `boolean` | Whether auto-play TTS is on |
| `text` | `UiText` | Localized label strings for the current language |
| `onLanguageChange` | `(lang: PageLanguage) => void` | Called when the language selector changes |
| `onVoiceToggle` | `() => void` | Called when the voice on/off button is clicked |
| `onDarkToggle` | `() => void` | Called when the dark mode button is clicked |

## Renders

- AOSIS logo (links to aosisolutions.com, inverts in dark mode)
- Assistant title and subtitle
- Language dropdown (`English / Español / Tiếng Việt`)
- Voice toggle button (shows current state: On/Off/Activada/etc.)
- Dark mode toggle button (☾ / ☀)

## Notes

This component is presentational only. It does not own state for language, dark mode, or voice settings; it receives values and emits callbacks.