# Almanac: Start Here For Operators

Almanac is a private web app for your property management work. It is meant to sit in front of your Google Drive and master spreadsheet, not replace them.

All bundled records, emails, owner names, vendor names, property records, and
Google URLs are sample data. Replace them only in your own private environment.

The app can run in two modes:

- Local demo mode: runs on your computer with fake data and no Google setup.
- Hosted beta mode: runs on Vercel, uses Clerk login, connects to your Google Drive, and stores an index in Postgres.

Start in local demo mode first. Then deploy. Then connect Google.

## Give This To Your AI Assistant

Use this prompt with Claude, Codex, or another coding assistant:

```text
You are helping me set up Almanac from scratch. Read OPERATOR_START_HERE.md, BOT_HANDOFF.md, README.md, and docs/operator-env-reference.md before changing anything. Do not use the alpha tester's Vercel, Clerk, Google Cloud, database, or email settings. Do not commit .env, .env.local, database files, node_modules, .next, or build output. First get the app running locally in mock mode. Then help me create my own Vercel, Postgres, Clerk, and Google Cloud setup. Ask before doing anything paid or before changing a live production setting.
```

## What You Need

Install or create these before the hosted beta:

- Node.js 20 or newer.
- Git.
- A Google account that owns or can access your property Drive files.
- A Vercel account for hosting.
- A Postgres database. Neon is a good starting point.
- A Clerk account for private login.
- Optional: an OpenAI API key for the AI assistant. Without it, Almanac still runs with a deterministic local assistant for testing.

## Fastest Safe Path

1. Unpack the Almanac folder.
2. Open it in your coding assistant or editor.
3. Run the local demo.
4. Confirm the app opens and fake data works.
5. Create your own hosted services.
6. Deploy to Vercel.
7. Connect Google from the app settings page.
8. Test with sample files before using real owner or tenant records.

## Local Demo Setup

From the Almanac folder:

```bash
npm install
cp .env.example .env
npm run db:init
npm run test
npm run dev
```

Open:

```text
http://localhost:3000
```

For the first local run, keep these values in `.env`:

```text
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./prisma/dev.db
AUTH_MODE=alpha
GOOGLE_MODE=local
OPENAI_API_KEY=
```

That lets you test without Google Cloud, Clerk, Vercel, or OpenAI.

## Hosted Beta Setup

Use hosted beta mode only after local demo mode works.

Your assistant should follow `BOT_HANDOFF.md`. The short version is:

1. Push this project to your own private GitHub repo.
2. Create a Vercel project from that repo.
3. Create a Postgres database and set `DATABASE_URL`.
4. Create a Clerk app and set Clerk environment variables.
5. Set `ALMANAC_ALLOWED_EMAILS` to your invited beta emails.
6. Create a Google Cloud OAuth web client.
7. Enable Google Drive, Google Docs, and Google Sheets APIs.
8. Add your Vercel callback URL to Google OAuth.
9. Deploy on Vercel.
10. Open `/settings/google` and connect your Google account.

## Google Data Setup

Almanac expects:

- One master spreadsheet with property and tenant rows.
- One Google Drive root folder that contains property folders and documents.
- Google Docs templates with placeholders like `{{tenant_name}}` and `{{property_address}}`.

The included fake portfolio lives in:

```text
fixtures/almanac-test-portfolio
```

Use that first. It is safer than testing against real tenant files.

## What Success Looks Like

Local success:

- `npm run test` passes.
- `npm run dev` starts.
- Almanac opens at `http://localhost:3000`.
- Houses, Search, Assistant, Documents, Vendors, and Settings load.

Hosted success:

- Production root redirects signed-out users to Clerk sign-in.
- Your invited email can sign in.
- Uninvited users cannot access Almanac data.
- `/settings/google` shows Google connected.
- `Sync portfolio index` finds your spreadsheet and Drive files.
- Documents can be generated from templates without editing original templates.

## Safety Rules

- Never commit `.env` or `.env.local`.
- Never paste API keys into public chats or GitHub.
- Do not connect real owner, tenant, or financial files until the sample portfolio works.
- Google Drive remains the source of truth. Almanac is an index and front end.
- If document generation says Google must be reconnected, go to `Settings > Google` and connect Google again.

## If You Get Stuck

Ask your assistant to run these and explain the output:

```bash
npm run test
npm run build
npm run alpha:readiness
npm run alpha:hosted-smoke
```

For hosted issues, ask it to check three separate things:

- Clerk invite state.
- `ALMANAC_ALLOWED_EMAILS`.
- The current Vercel production deployment.
