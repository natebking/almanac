# Security Review

Last reviewed: 2026-06-19

## Data Scrub Status

- Real personal names and real personal email addresses have been removed from source, docs, tests, fixtures, and setup notes.
- Included records, emails, owners, vendors, property details, Google URLs, and hosted URLs are dummy data or placeholders.
- `.env`, `.env.local`, `.vercel`, generated build bundles, local databases, `node_modules`, `.next`, and coverage output must stay out of source control.
- Use `example.com` addresses only in public docs, tests, and fixtures.

## Security Controls In Place

- Hosted access is gated by Clerk when `AUTH_MODE=clerk`.
- App-level allowlisting uses `ALMANAC_ALLOWED_EMAILS`.
- Google OAuth tokens are encrypted before database storage.
- Google OAuth now uses a short-lived, HTTP-only state cookie to reject callbacks that do not match a login attempt started by this app.
- Google Drive remains the source of truth. The app stores indexed metadata and snippets, not a duplicate document vault.

## Open Risks

- `npm audit --omit=dev` passes after parent-scoped root `overrides` pin the vulnerable transitive leaves to `next -> postcss@8.5.10` and `@prisma/dev -> @hono/node-server@1.19.13`. Keep those overrides until Next.js and Prisma ship non-vulnerable direct dependency pins.
- Google Drive readonly scope is broad enough to read files the connected account can access. For a wider public release, consider narrowing setup with a dedicated Drive root folder, a dedicated Google account, or a Google Picker flow.
- Do not connect real tenant, owner, lease, financial, or vendor files until the dummy portfolio setup and sync workflow passes.

## Recommended Pre-Release Checks

```bash
npm run lint
npm test
TMPDIR=/tmp/almanac-next-build-tmp npm run build
npm audit --omit=dev
```

Run a personal-data scan before sharing a public archive:

```bash
rg -n --hidden -S -i -g '!node_modules' -g '!.next' -g '!.git' -g '!coverage' -g '!build' 'real-name-or-email-pattern-here' .
```
