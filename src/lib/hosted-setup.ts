import { alphaTesterEmail } from "@/lib/alpha-config";

export type HostedSetupIssue =
  | "missing-clerk"
  | "missing-allowed-users"
  | "missing-google-oauth";

export type CriticalHostedSetupIssue = Exclude<
  HostedSetupIssue,
  "missing-google-oauth"
>;

export type HostedSetupEnv = Record<string, string | undefined>;

export function hostedSetupIssue(
  env: HostedSetupEnv = process.env,
): CriticalHostedSetupIssue | null {
  if (env.AUTH_MODE !== "clerk") {
    return null;
  }

  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
    return "missing-clerk";
  }

  if (!hasAllowedUserEmails(env.ALMANAC_ALLOWED_EMAILS)) {
    return "missing-allowed-users";
  }

  return null;
}

export function googleOAuthSetupIssue(
  env: HostedSetupEnv = process.env,
): Extract<HostedSetupIssue, "missing-google-oauth"> | null {
  if (env.AUTH_MODE !== "clerk") {
    return null;
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return "missing-google-oauth";
  }

  return null;
}

export function isGoogleBackedHostedPath(pathname: string): boolean {
  return (
    pathname === "/api/google/start" ||
    pathname === "/api/google/callback" ||
    pathname === "/api/sync/portfolio"
  );
}

export function shouldRedirectHostedPathToSignIn(pathname: string): boolean {
  return !pathname.startsWith("/api/") && !pathname.startsWith("/__clerk/");
}

export function hasAllowedUserEmails(value: string | undefined): boolean {
  return normalizedEmails(value).includes(alphaTesterEmail);
}

function normalizedEmails(value: string | undefined): string[] {
  return (value || "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
