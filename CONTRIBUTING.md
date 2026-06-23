# Contributing to Almanac

Thanks for your interest in Almanac — an open-source, self-hosted property
operations front end for teams already running on Google Drive and Sheets.

## Ground rules

- **Never commit secrets or real data.** Use `example.com` addresses and
  placeholder IDs everywhere. See [`SECURITY.md`](SECURITY.md).
- **Keep Drive as the source of truth.** Almanac indexes Google Drive and
  Sheets; it must not become a duplicate document store.
- **Stay in the wedge.** This is a Google-native front end, not a full property
  management system. Features like accounting, rent collection, payments, and
  resident portals are intentionally out of scope.

## Local setup

You need Node.js 20+ and the `sqlite3` CLI (preinstalled on macOS and most
Linux; `apt-get install sqlite3` if missing).

```bash
git clone <your-fork-url>
cd almanac
npm install
cp .env.example .env
npm run db:init   # builds the local SQLite demo DB and seeds sample data
npm run dev       # http://localhost:3000
```

Keep `AUTH_MODE=alpha` and `GOOGLE_MODE=local` for local development — no Google
account or paid services required.

## Before you open a pull request

Run the full local check and make sure it is green:

```bash
npm run lint
npm test
npm run build
```

Please also:

- Add or update tests for behavior you change (the suite lives in `src/test`).
- Keep changes focused; one concern per PR.
- Update docs/README when you change setup steps or environment variables.
- Use plain ASCII in code and docs.

## Reporting bugs and requesting features

Use the issue templates under **New issue**. For anything security-sensitive,
follow [`SECURITY.md`](SECURITY.md) instead of filing a public issue.

## Project layout

- `src/app` — Next.js routes (App Router) and API routes
- `src/lib` — data access, Google adapters, assistant, document generation
- `src/components` — shared UI
- `src/test` — Vitest suite
- `prisma` — schema (SQLite + Postgres) and migrations
- `fixtures` — sample portfolio for local and Drive testing
- `docs` — setup and architecture notes

By contributing, you agree your contributions are licensed under the project's
[MIT License](LICENSE).
