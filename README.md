# Almanac

Property operations on Google Drive. A mobile-friendly, source-grounded front
end for the property records you already keep in Google Drive and a master
spreadsheet.

> A personal project, originally built for a friend's property workflow and
> shared as-is — no warranty or support promised.

All included records, emails, property names, owners, vendors, and Google URLs
are sample data unless you replace them in your own private environment.

## Operator Self-Run Handoff

If an operator is running this from scratch with Claude, Codex, or another coding
assistant, start with:

- `OPERATOR_START_HERE.md` for the operator.
- `BOT_HANDOFF.md` for the coding assistant.
- `docs/operator-env-reference.md` for environment variables.

Create a clean handoff archive with:

```bash
npm run handoff:operator
```

The archive is written under `build/almanac-self-host-handoff` and excludes
secrets, local databases, `node_modules`, build output, and Vercel local state.

## Open-Source Release Track

The public name is `Almanac` (tagline "Property operations on Google Drive"),
pending a final domain and trademark check. The public landing page lives at
`/open-source`; it is separate from the authenticated app dashboard at `/`.

See `docs/security-review.md` for scrub status, security controls, and release
risks. Detailed release and market-positioning notes are kept in the operator's
private working copy, not in the public repository.

## Alpha Scope

- Today dashboard
- Houses indexed from the master spreadsheet
- Search across property rows, vendors, templates, generated documents, Drive metadata, and indexed document snippets
- Source-grounded assistant
- Vendors
- Financial, materials, and projects index views
- Document templates
- Generated Google Doc/PDF history
- Local Google mock mode
- Real Google OAuth, Sheets, Drive, Docs, and optional Calendar/Gmail metadata
  diagnostics when credentials are configured

## Source Of Truth

- The master spreadsheet owns property and tenant data.
- Google Drive owns files and folders.
- The app database is an index/cache and activity log.
- The app should not become duplicate storage for the operator's business records.

## Alpha Workflow

1. Sync or seed master spreadsheet rows into the local index.
2. Sync or seed Google Drive file metadata and supported document snippets into the local index.
3. Open Houses to view one page per spreadsheet-indexed property.
4. Use Search or Assistant to find property facts, Drive files, and indexed document contents.
5. Add a document template with placeholders such as `{{tenant_name}}`.
6. Open Documents, choose a template and spreadsheet-indexed property, then generate a copy.
7. Review the generated document in the app.
8. Use Review / print to open a printable browser view.

## Local Setup

Prerequisites: Node.js 20+ and the `sqlite3` command-line tool (preinstalled on
macOS and most Linux distributions; install with `apt-get install sqlite3` if
missing). `npm run db:init` uses `sqlite3` to apply the local migration SQL.

1. Copy `.env.example` to `.env`.
2. Keep `AUTH_MODE=alpha` for local single-user testing.
3. Keep `GOOGLE_MODE=local` for local mock testing.
4. Leave `OPENAI_API_KEY` blank to use the deterministic local assistant.
5. Run `npm install`.
6. Run `npm run db:init`.
7. Run `npm run dev`.

## Hosted Auth Setup

The app has Clerk wiring behind `AUTH_MODE=clerk`. For a hosted alpha, configure
Clerk in restricted or invitation-only mode, add the alpha tester and operator as invited users,
set `ALMANAC_ALLOWED_EMAILS` to the comma-separated invited emails, and set
the Clerk environment variables from `.env.example`.

Run the readiness check before inviting the operator:

```bash
vercel env pull .env.local --environment=production
npm run alpha:readiness
npm run alpha:clerk-access
npm run alpha:fixture-bundle
npm run alpha:google-oauth
npm run alpha:hosted-smoke
```

The pull command refreshes the ignored local env file with the hosted Production
settings. The readiness command checks those Vercel-pulled environment variables
and the sample fixture files. It reports blockers, warnings, and manual checks
without printing secret values.

The Clerk access command checks live Clerk users and invitations against
`ALMANAC_ALLOWED_EMAILS`. Clerk restricted mode still needs a dashboard
confirmation because the Clerk Backend API used here does not expose that
setting as a read-only check.

The fixture bundle command creates
`build/almanac-test-portfolio-upload` with the sample Drive files, an upload
checklist, and a manifest for manual Google Drive setup.

The Google OAuth command prints the exact Google Cloud APIs, redirect URI, and
Vercel env commands needed to clear the hosted Drive/Docs blocker. It exits
nonzero until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured.

After the operator's real email is added to `ALMANAC_ALLOWED_EMAILS`, dry-run the
Clerk invite before sending it:

```bash
vercel env run -e production --scope vercel-team-placeholder -- sh -c 'npm run alpha:invite-user -- --email operator@example.com'
```

Add `--send` only after the dry run says the address is ready.

After Google OAuth is configured, `npm run alpha:hosted-smoke` confirms that
the production site is Clerk login-gated, `/sign-in` is reachable, and the
setup page points to the beta smoke-test checklist.

## Hosted Database Setup

Local development uses SQLite by default. Hosted Vercel testing should use a
managed Postgres database such as Neon:

```bash
DATABASE_PROVIDER=postgres npm run db:generate
DATABASE_PROVIDER=postgres npm run db:push:postgres
```

Set `DATABASE_PROVIDER=postgres` and the managed Postgres `DATABASE_URL` in
Vercel before deploying the hosted alpha.

## AI Assistant Setup

The assistant always answers from the app's indexed spreadsheet and Drive facts.
When `OPENAI_API_KEY` is blank, the alpha uses the deterministic local assistant.
When `OPENAI_API_KEY` is set, `/api/assistant/ask` sends the question and compact
grounding facts to the OpenAI Responses API and accepts the model answer only
when its citations match the provided sources. Set `OPENAI_MODEL` to override the
default model.

## Real Google Setup

1. Create a Google Cloud OAuth client for a web app.
2. Enable Google Drive API, Google Docs API, and Google Sheets API.
3. Add `http://localhost:3000/api/google/callback` as an authorized redirect URI.
4. Set `GOOGLE_MODE=real`.
5. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.
6. Open `/settings/google` and connect Google.
7. Paste the master spreadsheet URL or ID, sheet tab name, and Drive root folder URL or ID into the source setup form.
8. Use a copied Google Docs template with placeholders such as `{{tenant_name}}`.
9. Add the copied template's Google Doc ID or URL to the template record.

The environment variables `GOOGLE_MASTER_SPREADSHEET_ID`,
`GOOGLE_MASTER_SHEET_NAME`, and `GOOGLE_TEST_ROOT_FOLDER_ID` remain supported as
a developer fallback, but the operator's normal setup should use the settings page.

To test optional diagnostics, also enable Google Calendar API and Gmail API,
then set `GOOGLE_OPTIONAL_DIAGNOSTICS=enabled` before reconnecting Google. Leave
this disabled for the operator's first alpha login unless those diagnostics are needed.

## Manual Portfolio Sync

The alpha can refresh the local index from Google when real mode is configured.

1. Start the app with `GOOGLE_MODE=real`.
2. Open `/settings/google`.
3. Connect Google if no account is connected.
4. Confirm the master spreadsheet and Drive root IDs are shown, or save them in the source setup form.
5. Press `Sync portfolio index`.

The sync reads the configured sheet range as `'<GOOGLE_MASTER_SHEET_NAME>'!A:Z`,
uses the first row as headers, upserts property rows, lists Drive metadata under
the configured root folder, links matching property folders, and indexes files
inside those folders. For Google Docs, plain text files, and Markdown files, it
also stores a short text extract in `DriveFileIndex.textExtract` so Search and
Assistant can answer from document contents. Google Drive remains the file
source.

### Drive Text Indexing

Manual portfolio sync indexes short text extracts from Google Docs, plain text
Drive files, and Markdown files. Google Drive remains the source of truth; the
app stores snippets in `DriveFileIndex.textExtract` so Search and Assistant can
answer from document contents. PDFs, OCR, and Office files are intentionally
deferred.

## Testing With Sample Data

Ready-to-upload sample files live in `fixtures/almanac-test-portfolio`. Use them
to build a fake Google Drive portfolio and master spreadsheet, then exercise the
onboarding, assistant, and document-generation flows before connecting any real
business files. If Google blocks the Apps Script setup path, run
`npm run alpha:fixture-manifest` for a manual Drive upload checklist. After
changing hosted environment variables, run
`vercel env pull .env.local --environment=production` and `npm run alpha:readiness`,
then fix every blocker before starting the hosted Google Drive test.

## Hosting And Auth

See `OPERATOR_START_HERE.md` for the recommended self-host path: Vercel, Clerk
invite-only login, managed Postgres, and Google OAuth, with a copy-paste prompt
for setting it up with an AI coding assistant. Use `npm run alpha:readiness` and
`npm run alpha:hosted-smoke` to check a hosted deployment before inviting users.

## Google Safety Rules

- The alpha must not edit original templates.
- Use copied test templates first.
- The alpha requests Sheets readonly, Drive metadata readonly, and Drive readonly scopes for indexing. Drive readonly is used for short document-content extracts from the selected Drive root.
- Calendar access is read-only and used only when
  `GOOGLE_OPTIONAL_DIAGNOSTICS=enabled`.
- Gmail access uses metadata scope only when
  `GOOGLE_OPTIONAL_DIAGNOSTICS=enabled`. The app reads headers such as subject,
  sender, and date, not message bodies.
- Gmail body access is out of scope.
- Direct one-click printer control is out of scope.

## Useful Routes

- `/` - Today dashboard
- `/houses` - Spreadsheet-indexed house list
- `/houses/[id]` - One-screen property profile with Drive quick links
- `/search` - Search spreadsheet, Drive metadata, indexed snippets, vendors, templates, and generated documents
- `/assistant` - Source-grounded local assistant
- `/more` - Financial, materials, templates, vendors, projects, and settings
- `/documents` - Templates, generated documents, and print review
- `/vendors` - Vendor directory
- `/settings/google` - Google mode, OAuth status, diagnostics, and portfolio sync
- `/api/google/diagnostics` - Safe JSON proof of Google configuration, Calendar summaries, and Gmail headers
- `/api/sync/portfolio` - Manual portfolio sync endpoint used by the settings page

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Note

Prisma 7 is used with the official `@prisma/adapter-better-sqlite3` adapter for
local SQLite and `@prisma/adapter-pg` for hosted Postgres. On this machine,
Prisma's SQLite migrate/apply command returned a blank schema-engine error,
while schema validation and SQL generation succeeded. The alpha therefore
commits the generated SQLite migration SQL and applies it through `sqlite3` with
`npm run db:init`.

Run the full local verification:

```bash
npm run db:init
npm run test
npm run build
```
