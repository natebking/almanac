import { describe, expect, it } from "vitest";
import {
  googleOAuthSetupIssue,
  hostedSetupIssue,
  isGoogleBackedHostedPath,
  shouldRedirectHostedPathToSignIn,
  type HostedSetupEnv,
} from "@/lib/hosted-setup";

const configuredEnv: HostedSetupEnv = {
  AUTH_MODE: "clerk",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fake",
  CLERK_SECRET_KEY: "sk_test_fake",
  ALMANAC_ALLOWED_EMAILS: "alpha-tester@example.com",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
};

describe("hosted setup gates", () => {
  it("does not gate alpha mode", () => {
    expect(
      hostedSetupIssue({
        ...configuredEnv,
        AUTH_MODE: "alpha",
      }),
    ).toBeNull();
  });

  it("checks Clerk before other hosted setup requirements", () => {
    expect(
      hostedSetupIssue({
        ...configuredEnv,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      }),
    ).toBe("missing-clerk");
  });

  it("checks allowed users before Google OAuth", () => {
    expect(
      hostedSetupIssue({
        ...configuredEnv,
        ALMANAC_ALLOWED_EMAILS: "",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
      }),
    ).toBe("missing-allowed-users");
  });

  it("requires the alpha tester's test Google account in the hosted allowlist", () => {
    expect(
      hostedSetupIssue({
        ...configuredEnv,
        ALMANAC_ALLOWED_EMAILS: "operator@example.com,assistant@example.com",
      }),
    ).toBe("missing-allowed-users");
  });

  it("does not block seeded demo routes when Google OAuth is still missing", () => {
    expect(
      hostedSetupIssue({
        ...configuredEnv,
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
      }),
    ).toBeNull();
  });

  it("reports the Google OAuth setup issue separately for Google-backed actions", () => {
    expect(
      googleOAuthSetupIssue({
        ...configuredEnv,
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
      }),
    ).toBe("missing-google-oauth");
  });

  it("returns no setup issue when hosted auth, allowed users, and Google OAuth are configured", () => {
    expect(hostedSetupIssue(configuredEnv)).toBeNull();
  });

  it("identifies hosted paths that require Google OAuth", () => {
    expect(isGoogleBackedHostedPath("/api/google/start")).toBe(true);
    expect(isGoogleBackedHostedPath("/api/sync/portfolio")).toBe(true);
    expect(isGoogleBackedHostedPath("/api/assistant/ask")).toBe(false);
    expect(isGoogleBackedHostedPath("/houses")).toBe(false);
  });

  it("redirects signed-out page routes to sign-in before Clerk's API-style 404 fallback", () => {
    expect(shouldRedirectHostedPathToSignIn("/")).toBe(true);
    expect(shouldRedirectHostedPathToSignIn("/houses")).toBe(true);
    expect(shouldRedirectHostedPathToSignIn("/settings/google")).toBe(true);
    expect(shouldRedirectHostedPathToSignIn("/api/assistant/ask")).toBe(false);
    expect(shouldRedirectHostedPathToSignIn("/__clerk/something")).toBe(false);
  });
});
