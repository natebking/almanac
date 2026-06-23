import { describe, expect, it } from "vitest";
import { setupGuidanceForReason } from "@/lib/setup-guidance";

describe("setup guidance", () => {
  it("explains the Google OAuth blocker with the exact hosted alpha steps", () => {
    const guidance = setupGuidanceForReason("missing-google-oauth");

    expect(guidance.heading).toBe("Google OAuth is the next blocker");
    expect(guidance.summary).toContain("alpha-tester@example.com");
    expect(guidance.summary).toContain("Google Cloud still needs OAuth credentials");
    expect(guidance.actions).toEqual([
      "Finish the Google Auth Platform setup for Almanac and accept the Google API Services User Data Policy only after the alpha tester approves that account-level policy step.",
      "Create a Google OAuth web client with https://almanac-alpha.example.com/api/google/callback as an authorized redirect URI.",
      "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel Production, then redeploy.",
      "Use the populated Almanac Test Portfolio folder and Almanac Test Master Spreadsheet for the hosted Drive smoke test.",
    ]);
  });

  it("falls back to the beta smoke-test guidance for unknown reasons", () => {
    const guidance = setupGuidanceForReason("something-new");

    expect(guidance.heading).toBe("Ready for the alpha tester's beta smoke test");
    expect(guidance.summary).toContain("alpha-tester@example.com");
    expect(guidance.actions).toContain(
      "Confirm Clerk Restricted mode or invitation-only access before sharing the hosted URL.",
    );
    expect(guidance.actions).toContain(
      "Test houses, search, assistant answers, document generation, review, and print from the hosted app.",
    );
  });
});
