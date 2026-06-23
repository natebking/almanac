import { almanacTestPortfolio } from "@/lib/alpha-config";

export type GoogleOAuthSetupInput = {
  appUrl: string | undefined;
  googleRedirectUri: string | undefined;
  googleClientId: string | undefined;
  googleClientSecret: string | undefined;
  testGoogleAccount: string;
  vercelScope: string;
};

export type GoogleOAuthSetupPlan = {
  ready: boolean;
  missing: string[];
  warnings: string[];
  appUrl: string;
  redirectUri: string;
  requiredApis: string[];
  steps: string[];
  vercelCommands: string[];
};

export function buildGoogleOAuthSetupPlan({
  appUrl,
  googleRedirectUri,
  googleClientId,
  googleClientSecret,
  testGoogleAccount,
  vercelScope,
}: GoogleOAuthSetupInput): GoogleOAuthSetupPlan {
  const normalizedAppUrl =
    trimTrailingSlash(appUrl) || "https://almanac-alpha.example.com";
  const redirectUri =
    googleRedirectUri?.trim() || `${normalizedAppUrl}/api/google/callback`;
  const missing = [
    ...(!isConfigured(googleClientId) ? ["GOOGLE_CLIENT_ID"] : []),
    ...(!isConfigured(googleClientSecret) ? ["GOOGLE_CLIENT_SECRET"] : []),
  ];
  const warnings = isCallbackUri(redirectUri)
    ? []
    : ["GOOGLE_REDIRECT_URI should end with /api/google/callback."];

  return {
    ready: missing.length === 0 && warnings.length === 0,
    missing,
    warnings,
    appUrl: normalizedAppUrl,
    redirectUri,
    requiredApis: ["Google Drive API", "Google Docs API", "Google Sheets API"],
    steps: [
      `Enable 2-step verification for ${testGoogleAccount} if Google Cloud requires it.`,
      "Open Google Cloud Console with the test Google account.",
      "Create or select the Almanac alpha Google Cloud project.",
      "Enable Google Drive API, Google Docs API, and Google Sheets API.",
      "Configure the OAuth consent screen for a test/internal alpha.",
      "Finish Google Auth Platform setup and accept the Google API Services User Data Policy only after the alpha tester approves that account-level policy step.",
      "Create a Google Cloud OAuth web client for Almanac.",
      `Add ${redirectUri} as an authorized redirect URI.`,
      "Copy the client ID and client secret into Vercel Production and Development env vars.",
      "Redeploy Almanac and rerun npm run alpha:readiness.",
      `Run the hosted Google Drive smoke test with ${almanacTestPortfolio.driveFolderName}: ${almanacTestPortfolio.driveFolderUrl}.`,
      `Use ${almanacTestPortfolio.masterSpreadsheetName} (${almanacTestPortfolio.sheetTabName}): ${almanacTestPortfolio.masterSpreadsheetUrl}.`,
    ],
    vercelCommands: [
      `vercel env add GOOGLE_CLIENT_ID production --scope ${vercelScope}`,
      `vercel env add GOOGLE_CLIENT_SECRET production --scope ${vercelScope}`,
      `vercel env add GOOGLE_CLIENT_ID development --scope ${vercelScope}`,
      `vercel env add GOOGLE_CLIENT_SECRET development --scope ${vercelScope}`,
    ],
  };
}

export function formatGoogleOAuthSetupPlan(plan: GoogleOAuthSetupPlan): string {
  const lines = [
    "Almanac Google OAuth setup",
    "",
    `App URL: ${plan.appUrl}`,
    `Redirect URI: ${plan.redirectUri}`,
    `Ready: ${plan.ready ? "yes" : "no"}`,
    "",
    "Required Google APIs:",
    ...plan.requiredApis.map((api) => `- ${api}`),
    "",
    "Missing env vars:",
    ...(plan.missing.length > 0 ? plan.missing.map((name) => `- ${name}`) : ["- None"]),
  ];

  if (plan.warnings.length > 0) {
    lines.push("", "Warnings:", ...plan.warnings.map((warning) => `- ${warning}`));
  }

  lines.push(
    "",
    "Setup steps:",
    ...plan.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Vercel env commands:",
    ...plan.vercelCommands.map((command) => `- ${command}`),
    "",
    "Do not paste the client secret into chat or docs. Enter it only into Vercel or a local ignored .env file.",
  );

  return `${lines.join("\n")}\n`;
}

function isConfigured(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isCallbackUri(value: string): boolean {
  try {
    return new URL(value).pathname === "/api/google/callback";
  } catch {
    return false;
  }
}

function trimTrailingSlash(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, "") || "";
}
