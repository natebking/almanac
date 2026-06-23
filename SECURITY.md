# Security Policy

Almanac connects to a property operator's Google Drive, Sheets, and Docs and
indexes business records. We take security and data handling seriously.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public GitHub issue
for anything that could expose credentials or data.

- Email the maintainer privately at **nate@natebking.com**, or
- Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
  on this repository (Security tab → "Report a vulnerability").

Please include: affected version/commit, reproduction steps, and the impact you
observed. We aim to acknowledge reports within a few days.

## What to report

- Authentication or authorization bypass (reaching data without being an
  allow-listed user)
- Leakage of Google OAuth tokens, secrets, or another user's data
- Open redirect, SSRF, injection, or CSRF in the Google OAuth or sync flows
- Any way the app writes to or deletes a connected Google account's original
  files

## Handling secrets and personal data

If you are running or contributing to Almanac:

- **Never commit** `.env`, `.env.local`, `.vercel`, local databases
  (`prisma/dev.db`), `node_modules`, `.next`, build output, or
  `src/generated/prisma`. These are already in `.gitignore`.
- Use only `example.com` addresses and placeholder IDs in code, tests,
  fixtures, and docs. Never put real tenant, owner, lease, financial, vendor,
  Google account, or hosting-project values into the repository.
- Do not connect real tenant/owner/financial files until the sample portfolio
  in `fixtures/` and the sync workflow pass for you.

## Security model (summary)

- Hosted access is gated by your login provider when `AUTH_MODE=clerk`, and
  every data request additionally checks an email allow-list
  (`ALMANAC_ALLOWED_EMAILS`) and fails closed for non-allowed users.
- Google OAuth tokens are encrypted (AES-256-GCM) before they are stored.
- The OAuth callback validates a short-lived, HTTP-only state cookie (CSRF).
- Google Drive remains the source of truth; the app stores indexed metadata and
  short snippets, not a duplicate document vault.

## Known limitations

- `AUTH_MODE=alpha` (the local-demo default) runs **without authentication** so
  the demo works offline. Never deploy a publicly reachable instance with
  `AUTH_MODE=alpha`; use `AUTH_MODE=clerk` for any hosted deployment.
- The Google Drive read scope can read files the connected account can access.
  Prefer a dedicated Drive folder and/or a dedicated Google account for the
  portfolio.
