# operator Environment Reference

This file explains the environment variables operator needs for Almanac.

Do not commit real values. Put local values in `.env`. Put hosted values in Vercel environment variables. `.env.local` is ignored and can be used for pulled Vercel values.

## Local Demo Values

Use these first:

```text
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./prisma/dev.db
AUTH_SECRET=replace-with-32-plus-random-characters
AUTH_MODE=alpha
ALMANAC_ALLOWED_EMAILS=
APP_URL=http://localhost:3000
GOOGLE_MODE=local
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
GOOGLE_OPTIONAL_DIAGNOSTICS=disabled
GOOGLE_TEST_ROOT_FOLDER_ID=
GOOGLE_MASTER_SPREADSHEET_ID=
GOOGLE_MASTER_SHEET_NAME=Rentals
OPENAI_API_KEY=
OPENAI_MODEL=
```

## Hosted Required Values

| Name | Required | Example | Notes |
| --- | --- | --- | --- |
| `DATABASE_PROVIDER` | Yes | `postgres` | Use `sqlite` only for local demo mode. |
| `DATABASE_URL` | Yes | Neon Postgres URL | Store only in Vercel or ignored local env files. |
| `AUTH_SECRET` | Yes | Random 32-plus character string | Used for app-side auth/session cryptography. |
| `AUTH_MODE` | Yes | `clerk` | Hosted beta should use Clerk. |
| `APP_URL` | Yes | `https://almanac.your-domain.com` | Must match the deployed app URL. |
| `ALMANAC_ALLOWED_EMAILS` | Yes | `operator@example.com` | Comma-separated list of emails allowed past the app gate. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk value | Public Clerk browser key. |
| `CLERK_SECRET_KEY` | Yes | Clerk value | Secret Clerk backend key. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | `/sign-in` | Clerk route used by the app. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | `/sign-up` | Clerk route used by the app. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Yes | `/` | Where Clerk redirects after sign-in. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Yes | `/` | Where Clerk redirects after sign-up. |
| `GOOGLE_MODE` | Yes | `real` | Hosted Google testing uses real mode. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | From the operator's Google Cloud project. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth secret | From the operator's Google Cloud project. |
| `GOOGLE_REDIRECT_URI` | Yes | `https://<domain>/api/google/callback` | Must be listed in Google OAuth client settings. |
| `GOOGLE_OPTIONAL_DIAGNOSTICS` | Yes | `disabled` | Leave disabled for first beta. |
| `GOOGLE_MASTER_SHEET_NAME` | Yes | `Rentals` | Can be changed in app source settings later. |

## Optional Values

| Name | When To Use | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | When operator wants the model-backed assistant | If blank, Almanac uses deterministic local assistant behavior for safer testing. |
| `OPENAI_MODEL` | When selecting a specific model | Leave blank or use the app default unless there is a reason to override. |
| `GOOGLE_TEST_ROOT_FOLDER_ID` | Developer fallback | Normal operator setup should use `/settings/google`, not env IDs. |
| `GOOGLE_MASTER_SPREADSHEET_ID` | Developer fallback | Normal operator setup should use `/settings/google`, not env IDs. |

## Google Redirect URIs

Add both if operator wants local and hosted Google testing:

```text
http://localhost:3000/api/google/callback
https://<operator-vercel-domain>/api/google/callback
```

If the redirect URI in Vercel does not exactly match the Google OAuth client, Google login will fail.

## Allowlist Rule

Clerk controls sign-in. `ALMANAC_ALLOWED_EMAILS` controls app access after sign-in.

For example, if operator has a Clerk invite but his email is missing from `ALMANAC_ALLOWED_EMAILS`, he can sign in but Almanac will reject him.

After changing `ALMANAC_ALLOWED_EMAILS`, redeploy Vercel.
