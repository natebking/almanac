import { describe, expect, it } from "vitest";
import { almanacTestPortfolio } from "@/lib/alpha-config";
import {
  buildGoogleOAuthSetupPlan,
  formatGoogleOAuthSetupPlan,
} from "@/lib/google-oauth-setup";

describe("Google OAuth setup plan", () => {
  it("turns missing credentials into exact setup steps", () => {
    const plan = buildGoogleOAuthSetupPlan({
      appUrl: "https://almanac-alpha.example.com",
      googleRedirectUri: "https://almanac-alpha.example.com/api/google/callback",
      googleClientId: "",
      googleClientSecret: "",
      testGoogleAccount: "alpha-tester@example.com",
      vercelScope: "vercel-team-placeholder",
    });

    expect(plan.ready).toBe(false);
    expect(plan.missing).toEqual(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]);
    expect(plan.redirectUri).toBe(
      "https://almanac-alpha.example.com/api/google/callback",
    );
    expect(plan.requiredApis).toEqual([
      "Google Drive API",
      "Google Docs API",
      "Google Sheets API",
    ]);
    expect(plan.steps).toEqual(
      expect.arrayContaining([
        "Enable 2-step verification for alpha-tester@example.com if Google Cloud requires it.",
        "Finish Google Auth Platform setup and accept the Google API Services User Data Policy only after the alpha tester approves that account-level policy step.",
        "Create a Google Cloud OAuth web client for Almanac.",
        "Add https://almanac-alpha.example.com/api/google/callback as an authorized redirect URI.",
        `Run the hosted Google Drive smoke test with ${almanacTestPortfolio.driveFolderName}: ${almanacTestPortfolio.driveFolderUrl}.`,
        `Use ${almanacTestPortfolio.masterSpreadsheetName} (${almanacTestPortfolio.sheetTabName}): ${almanacTestPortfolio.masterSpreadsheetUrl}.`,
      ]),
    );
  });

  it("marks OAuth ready when credentials and callback are configured", () => {
    const plan = buildGoogleOAuthSetupPlan({
      appUrl: "https://almanac-alpha.example.com",
      googleRedirectUri: "https://almanac-alpha.example.com/api/google/callback",
      googleClientId: "1087216937525-example.apps.googleusercontent.com",
      googleClientSecret: "secret",
      testGoogleAccount: "alpha-tester@example.com",
      vercelScope: "vercel-team-placeholder",
    });

    expect(plan.ready).toBe(true);
    expect(plan.missing).toEqual([]);
    expect(plan.warnings).toEqual([]);
  });

  it("formats Vercel commands without printing secret values", () => {
    const plan = buildGoogleOAuthSetupPlan({
      appUrl: "https://almanac-alpha.example.com",
      googleRedirectUri: "https://almanac-alpha.example.com/api/google/callback",
      googleClientId: "",
      googleClientSecret: "super-secret-value",
      testGoogleAccount: "alpha-tester@example.com",
      vercelScope: "vercel-team-placeholder",
    });

    const formatted = formatGoogleOAuthSetupPlan(plan);

    expect(formatted).toContain("Almanac Google OAuth setup");
    expect(formatted).toContain(
      "vercel env add GOOGLE_CLIENT_ID production --scope vercel-team-placeholder",
    );
    expect(formatted).toContain(
      "vercel env add GOOGLE_CLIENT_SECRET production --scope vercel-team-placeholder",
    );
    expect(formatted).not.toContain("super-secret-value");
  });
});
