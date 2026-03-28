# WordPress Integration — AOSIS Smart Assistant

Embeds the AOSIS Smart Assistant as a popup chat bubble in the bottom-right corner of any WordPress site using an iframe.

## Setup Steps

1. Deploy the Next.js app to Vercel and note your deployment URL (e.g. `https://your-app.vercel.app`).
2. Open `chat-embed.html` and replace `https://your-app.vercel.app` with your actual Vercel URL.
3. In WordPress, install the **WPCode** plugin (or use **Appearance → Theme File Editor**).
4. Paste the full contents of `chat-embed.html` into your site's footer.
5. Save and visit your WordPress site — the chat bubble will appear in the bottom-right corner.

## Requirements

- Your WordPress site must be served over **HTTPS**, otherwise the browser will block the iframe.
- Your Vercel deployment must also be on **HTTPS** (it is by default).

## Files

| File | Purpose |
| --- | --- |
| `README.md` | Setup instructions (this file) |
| `chat-embed.html` | The full embed snippet to paste into WordPress |
