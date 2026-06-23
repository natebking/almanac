import { almanacTestPortfolio } from "@/lib/alpha-config";

export type SetupGuidance = {
  heading: string;
  summary: string;
  actions: string[];
};

export function setupGuidanceForReason(
  reason: string | string[] | undefined,
): SetupGuidance {
  const normalizedReason = Array.isArray(reason) ? reason[0] : reason;

  if (normalizedReason === "missing-google-oauth") {
    return {
      heading: "Google OAuth is the next blocker",
      summary:
        "Almanac is deployed and the alpha tester's test email, alpha-tester@example.com, is allowed, but Google Cloud still needs OAuth credentials before Drive, Docs, and Sheets can connect.",
      actions: [
        "Finish the Google Auth Platform setup for Almanac and accept the Google API Services User Data Policy only after the alpha tester approves that account-level policy step.",
        "Create a Google OAuth web client with https://almanac-alpha.example.com/api/google/callback as an authorized redirect URI.",
        "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel Production, then redeploy.",
        `Use the populated ${almanacTestPortfolio.driveFolderName} folder and ${almanacTestPortfolio.masterSpreadsheetName} for the hosted Drive smoke test.`,
      ],
    };
  }

  if (normalizedReason === "missing-allowed-users") {
    return {
      heading: "Allowed alpha users are missing",
      summary:
        "Clerk can protect the app, but Almanac also needs an explicit email allowlist before any signed-in user can access alpha data.",
      actions: [
        "Set ALMANAC_ALLOWED_EMAILS in Vercel Production with the alpha tester's test email first.",
        "Keep operator out of ALMANAC_ALLOWED_EMAILS until the alpha tester's dummy-file smoke test passes.",
        "Redeploy and confirm the setup page moves on to the beta smoke-test checklist.",
      ],
    };
  }

  if (normalizedReason === "missing-clerk") {
    return {
      heading: "Clerk login is missing",
      summary:
        "The hosted app needs Clerk keys before Almanac can issue secure the alpha tester and operator logins.",
      actions: [
        "Confirm the Clerk Marketplace integration is connected to the Vercel project.",
        "Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in Vercel Production.",
        "Enable Clerk Restricted mode or invitation-only access before sharing the hosted URL.",
      ],
    };
  }

  return {
    heading: "Ready for the alpha tester's beta smoke test",
    summary:
      "Almanac is deployed with secure login, Google Drive/Docs/Sheets access, and the alpha tester's test email, alpha-tester@example.com. Run the hosted dummy-data workflow once before inviting the operator.",
    actions: [
      "Confirm Clerk Restricted mode or invitation-only access before sharing the hosted URL.",
      `Sync the populated ${almanacTestPortfolio.driveFolderName} folder and ${almanacTestPortfolio.masterSpreadsheetName}.`,
      "Test houses, search, assistant answers, document generation, review, and print from the hosted app.",
      "Add the operator's real email to ALMANAC_ALLOWED_EMAILS and invite him only after the hosted smoke test passes.",
    ],
  };
}
