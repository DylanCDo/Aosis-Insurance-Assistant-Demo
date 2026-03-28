# ChatInput

**Source component:** `app/components/ChatInput.tsx`

## Overview

`ChatInput` renders the message input form at the bottom of the chat.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `input` | `string` | Current textarea value |
| `loading` | `boolean` | Whether a response is being generated (disables the send button) |
| `isDark` | `boolean` | Whether dark mode is active |
| `placeholder` | `string` | Localized placeholder text for the textarea |
| `sendLabel` | `string` | Localized label for the send button |
| `onChange` | `(value: string) => void` | Called on every textarea keystroke |
| `onSubmit` | `(e: FormEvent) => void` | Called on form submit or Enter key |

## Renders

- A `<textarea>` (2 rows, resizable disabled)
- A Send `<button>` (disabled while loading or input is empty)
- **Enter** key submits the form; **Shift+Enter** inserts a newline

## Notes

This component is intentionally minimal. It handles the form and keybinding behavior, but it does not own the input state or submit logic.