This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## System Design

See [docs/system-design.md](docs/system-design.md) for architecture, runtime flow, OpenAI integration, and operational setup.
See [docs/company-context.md](docs/company-context.md) for business context and prompt-rule configuration details.

## Transcript Logging (Optional)

This app supports server-side chat transcript logging using Neon/Postgres.

See [docs/chat-transcription.md](docs/chat-transcription.md) for full flow, schema details, verification SQL, and troubleshooting.
See [docs/transcript-store.md](docs/transcript-store.md) for module-level behavior of the transcript persistence layer.
See [docs/database-schema.md](docs/database-schema.md) for table, column, relationship, and index definitions.

1. Provision a Postgres database (for example Neon on Vercel).
2. Ensure Postgres environment variables are available to the app runtime.
3. Install dependencies and run the app:

```bash
npm install
npm run dev
```

Transcript tables are auto-created on first transcript write. If Postgres env vars are not configured, transcript logging is skipped and chat still works.

Optional: You can still manually run [db/schema.sql](db/schema.sql) in Neon for explicit schema management.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
