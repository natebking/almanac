# Almanac Bot Handoff

You are helping operator run Almanac from scratch. Assume operator has none of the alpha tester's local setup, accounts, environment variables, Vercel project, Clerk app, Google Cloud project, database, OAuth client, or test Google data.

Do not use or reference the alpha tester's live resources unless operator explicitly says he is taking over that exact deployment. The default is a fresh operator-owned setup.

## Mission

Get operator from an unpacked project folder to:

1. A working local Almanac demo.
2. A private hosted Vercel beta.
3. A connected Google Drive and master spreadsheet.
4. A repeatable test plan using dummy data before real property data.

## Repo Map

- `src/app`: Next.js App Router pages and API routes.
- `src/lib`: app logic, Google adapters, assistant grounding, document generation, search, sync, auth helpers.
- `src/components`: shared UI components.
- `prisma`: database schema, migrations, seed script.
- `fixtures/almanac-test-portfolio`: safe dummy portfolio for Google Drive testing.
- `scripts`: setup, readiness, invite, fixture, and package helpers.
- `docs`: design notes, testing plan, deployment notes, and operator-specific setup references.
- `.env.example`: starting environment template. Copy it to `.env` for local work.

## Hard Rules

- Do not commit `.env`, `.env.local`, `.vercel`, `node_modules`, `.next`, `build`, `coverage`, `prisma/dev.db`, or `src/generated/prisma`.
- Ask before creating paid resources.
- Ask before changing a live production environment variable.
- Ask before connecting real tenant, owner, financial, or lease files.
- Treat Google Drive as the source of truth. The app database is only an index, cache, and activity log.
- Never edit original Google Docs templates during tests. Work from copied templates.

## Phase 1: Local Demo

Use local demo mode before any hosted setup.

```bash
npm install
cp .env.example .env
npm run db:init
npm run test
npm run dev
```

Keep local `.env` simple:

```text
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./prisma/dev.db
AUTH_MODE=alpha
GOOGLE_MODE=local
OPENAI_API_KEY=
```

Open `http://localhost:3000`.

Verify:

- `/` loads the Today dashboard.
- `/houses` loads seeded properties.
- `/search` can find fake property data.
- `/assistant` answers from seeded/indexed facts.
- `/documents` can generate from local templates.

## Phase 2: Private Repo

Create a operator-owned private GitHub repository. Commit the project files, excluding ignored local state.

Before committing:

```bash
git status --short
npm run test
npm run build
```

If `.env` or `.env.local` appears in `git status`, stop and fix `.gitignore` or remove those files from the commit.

## Phase 3: Hosted Services

Create new operator-owned services:

- Vercel project connected to the private GitHub repo.
- Postgres database. Neon is fine for the beta.
- Clerk app for authentication.
- Google Cloud project for OAuth and Google APIs.

Do not reuse the alpha tester's project names, scopes, OAuth credentials, or database URL.

## Phase 4: Hosted Environment Variables

Set these in Vercel Production:

```text
DATABASE_PROVIDER=postgres
DATABASE_URL=<operator-postgres-url>
AUTH_SECRET=<32-plus-character-random-secret>
AUTH_MODE=clerk
APP_URL=https://<operator-vercel-domain>
ALMANAC_ALLOWED_EMAILS=<operator-email>,<assistant-test-email-if-needed>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<operator-clerk-publishable-key>
CLERK_SECRET_KEY=<operator-clerk-secret-key>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
GOOGLE_MODE=real
GOOGLE_CLIENT_ID=<operator-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<operator-google-oauth-client-secret>
GOOGLE_REDIRECT_URI=https://<operator-vercel-domain>/api/google/callback
GOOGLE_OPTIONAL_DIAGNOSTICS=disabled
GOOGLE_MASTER_SHEET_NAME=Rentals
OPENAI_API_KEY=<optional>
OPENAI_MODEL=<optional>
```

See `docs/operator-env-reference.md` for details.

After setting or changing Vercel environment variables, redeploy. Vercel environment variables are deployment-scoped.

## Phase 5: Database

Pull hosted env locally into an ignored file:

```bash
vercel env pull .env.local --environment=production
```

Push the Postgres schema:

```bash
DATABASE_PROVIDER=postgres npm run db:push:postgres
```

If the schema push fails, check that `.env.local` has a valid hosted `DATABASE_URL` and that the database allows external connections.

## Phase 6: Clerk

In Clerk:

1. Enable restricted or invitation-only access.
2. Invite the operator's email.
3. Confirm `ALMANAC_ALLOWED_EMAILS` includes the same email.
4. Keep Clerk invite state and Almanac allowlist separate in your checks.

Useful commands after env is configured:

```bash
npm run alpha:clerk-access
npm run alpha:invite-user -- --email operator@example.com
npm run alpha:invite-user -- --email operator@example.com --send
```

Only use `--send` after the dry run says the invitation is ready.

## Phase 7: Google Cloud

In Google Cloud:

1. Create a Google Cloud project.
2. Configure OAuth consent.
3. Create an OAuth client of type Web application.
4. Enable Google Drive API.
5. Enable Google Docs API.
6. Enable Google Sheets API.
7. Add local redirect URI: `http://localhost:3000/api/google/callback`.
8. Add hosted redirect URI: `https://<operator-vercel-domain>/api/google/callback`.

Optional later:

- Enable Google Calendar API only if diagnostics are needed.
- Enable Gmail API only if metadata diagnostics are needed.

Keep `GOOGLE_OPTIONAL_DIAGNOSTICS=disabled` for the first beta.

## Phase 8: Google Data Onboarding

Use dummy data before real files.

```bash
npm run alpha:fixture-bundle
```

That creates an upload bundle under `build/`. Upload the dummy files to Google Drive, then create or connect the test master spreadsheet.

In the app:

1. Open `/settings/google`.
2. Connect Google.
3. Enter the master spreadsheet URL or ID.
4. Enter the sheet tab name.
5. Enter the Drive root folder URL or ID.
6. Save source settings.
7. Click `Sync portfolio index`.

Only after this works should operator point Almanac at real property folders and the real master spreadsheet.

## Phase 9: Hosted Verification

Run:

```bash
npm run alpha:readiness
npm run alpha:hosted-smoke
npm run test
npm run build
```

Manual checks:

- Sign out and confirm `/` redirects to Clerk sign-in.
- Sign in with the operator's invited email.
- Confirm `/settings/google` can connect Google.
- Sync the dummy portfolio.
- Search for a dummy address.
- Ask the assistant a dummy portfolio question.
- Generate a document from a copied template.
- Open `Print PDF` and `Google Docs` actions.

## Known Sharp Edges

- Clerk invitation and Almanac allowlist are separate. A user can have a Clerk invite and still be blocked if `ALMANAC_ALLOWED_EMAILS` is wrong.
- Vercel env changes need a redeploy.
- Google `unauthorized_client`, `invalid_client`, or `invalid_grant` usually means reconnect Google or verify OAuth client settings.
- Local SQLite setup uses `npm run db:init`. Hosted Postgres uses `DATABASE_PROVIDER=postgres npm run db:push:postgres`.
- The assistant only answers from indexed facts. If data was not synced or indexed, the correct answer is that it cannot find the information.
- PDFs and OCR are not first-version indexing targets. Google Docs, Markdown, and plain text snippets are indexed first.

## When Done

Leave operator with:

- The production URL.
- The invited login email.
- A list of environment variables that are configured, without secret values.
- The Google Drive root folder being indexed.
- The master spreadsheet being indexed.
- The last successful verification commands and dates.
