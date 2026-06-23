import {
  almanacTestPortfolio,
  alphaTesterEmail,
} from "@/lib/alpha-config";

export type ReadinessStatus = "pass" | "missing" | "manual" | "warning";

export type ReadinessCheck = {
  id: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
};

export type AlphaReadinessEnv = Partial<
  Record<
    | "DATABASE_PROVIDER"
    | "DATABASE_URL"
    | "AUTH_MODE"
    | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    | "CLERK_SECRET_KEY"
    | "ALMANAC_ALLOWED_EMAILS"
    | "GOOGLE_MODE"
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET"
    | "GOOGLE_REDIRECT_URI"
    | "GOOGLE_OPTIONAL_DIAGNOSTICS"
    | "OPENAI_API_KEY",
    string
  >
>;

export type FixtureInventory = {
  masterSpreadsheetExists: boolean;
  propertyFolders: string[];
  templateFiles: string[];
  sourceFilesByProperty: Record<string, string[]>;
};

export type AlphaReadinessReport = {
  readyForHostedAlphaTest: boolean;
  blockers: ReadinessCheck[];
  warnings: ReadinessCheck[];
  manualChecks: ReadinessCheck[];
  nextActions: ReadinessCheck[];
  checks: ReadinessCheck[];
};

export const expectedAlmanacFixtureInventory = {
  expectedProperties: ["Estates", "Loch Lomand", "St. Paul", "Verona", "Wood Court"],
  minimumTemplateFiles: 3,
};

type AssessAlphaReadinessInput = {
  env: AlphaReadinessEnv;
  fixtures: FixtureInventory;
};

export function assessAlphaReadiness({
  env,
  fixtures,
}: AssessAlphaReadinessInput): AlphaReadinessReport {
  const hasGoogleOAuthCredentials =
    isConfigured(env.GOOGLE_CLIENT_ID) && isConfigured(env.GOOGLE_CLIENT_SECRET);
  const checks: ReadinessCheck[] = [
    requiredCheck({
      id: "database-provider",
      label: "Hosted database provider",
      pass: env.DATABASE_PROVIDER === "postgres",
      passDetail: "DATABASE_PROVIDER is set to postgres for hosted Neon.",
      missingDetail: "Set DATABASE_PROVIDER=postgres in Vercel.",
    }),
    requiredCheck({
      id: "database-url",
      label: "Hosted database URL",
      pass: isPostgresUrl(env.DATABASE_URL),
      passDetail: "DATABASE_URL is configured for Postgres.",
      missingDetail: "Set the managed Postgres DATABASE_URL in Vercel.",
    }),
    requiredCheck({
      id: "auth-mode",
      label: "Hosted auth mode",
      pass: env.AUTH_MODE === "clerk",
      passDetail: "AUTH_MODE is set to clerk.",
      missingDetail: "Set AUTH_MODE=clerk for the hosted alpha.",
    }),
    requiredCheck({
      id: "clerk-publishable-key",
      label: "Clerk publishable key",
      pass: isConfigured(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
      passDetail: "The Clerk publishable key is configured.",
      missingDetail: "Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in Vercel.",
    }),
    requiredCheck({
      id: "clerk-secret-key",
      label: "Clerk secret key",
      pass: isConfigured(env.CLERK_SECRET_KEY),
      passDetail: "The Clerk secret key is configured.",
      missingDetail: "Set CLERK_SECRET_KEY in Vercel.",
    }),
    requiredCheck({
      id: "allowed-users",
      label: "Invite-only email allowlist",
      pass: normalizedEmails(env.ALMANAC_ALLOWED_EMAILS).includes(
        alphaTesterEmail,
      ),
      passDetail: `ALMANAC_ALLOWED_EMAILS includes ${alphaTesterEmail}.`,
      missingDetail: `Set ALMANAC_ALLOWED_EMAILS to include ${alphaTesterEmail} before the alpha tester's hosted dummy-file test. Add operator only after that test passes.`,
    }),
    requiredCheck({
      id: "google-mode",
      label: "Real Google mode",
      pass: env.GOOGLE_MODE === "real",
      passDetail: "GOOGLE_MODE is set to real.",
      missingDetail: "Set GOOGLE_MODE=real in Vercel.",
    }),
    requiredCheck({
      id: "google-client-id",
      label: "Google OAuth client ID",
      pass: isConfigured(env.GOOGLE_CLIENT_ID),
      passDetail: "GOOGLE_CLIENT_ID is configured.",
      missingDetail: "Create the Google OAuth web client and set GOOGLE_CLIENT_ID.",
    }),
    requiredCheck({
      id: "google-client-secret",
      label: "Google OAuth client secret",
      pass: isConfigured(env.GOOGLE_CLIENT_SECRET),
      passDetail: "GOOGLE_CLIENT_SECRET is configured.",
      missingDetail: "Set GOOGLE_CLIENT_SECRET from the Google OAuth web client.",
    }),
    requiredCheck({
      id: "google-redirect-uri",
      label: "Google OAuth redirect URI",
      pass: isGoogleCallbackUrl(env.GOOGLE_REDIRECT_URI),
      passDetail: "GOOGLE_REDIRECT_URI points at the Almanac callback route.",
      missingDetail:
        "Set GOOGLE_REDIRECT_URI to https://almanac-alpha.example.com/api/google/callback.",
    }),
    diagnosticCheck(env.GOOGLE_OPTIONAL_DIAGNOSTICS),
    warningCheck({
      id: "openai-key",
      label: "OpenAI API key",
      pass: isConfigured(env.OPENAI_API_KEY),
      passDetail: "OPENAI_API_KEY is configured for model-backed answers.",
      warningDetail:
        "OPENAI_API_KEY is blank. The deterministic local assistant still works for alpha smoke testing.",
    }),
    requiredCheck({
      id: "fixture-master-spreadsheet",
      label: "Dummy master spreadsheet CSV",
      pass: fixtures.masterSpreadsheetExists,
      passDetail: "The dummy master spreadsheet CSV exists.",
      missingDetail:
        "Restore fixtures/almanac-test-portfolio/master-spreadsheet.csv before testing.",
    }),
    requiredCheck({
      id: "fixture-property-folders",
      label: "Dummy property folders",
      pass: missingExpectedProperties(fixtures.propertyFolders).length === 0,
      passDetail: "All expected dummy property folders are present.",
      missingDetail: `Missing dummy folders: ${missingExpectedProperties(
        fixtures.propertyFolders,
      ).join(", ")}`,
    }),
    requiredCheck({
      id: "fixture-templates",
      label: "Dummy template files",
      pass:
        fixtures.templateFiles.length >=
        expectedAlmanacFixtureInventory.minimumTemplateFiles,
      passDetail: "At least three dummy templates are present.",
      missingDetail:
        "Add the Move-In Checklist, Welcome Letter, and Utility Transfer Letter templates.",
    }),
    requiredCheck({
      id: "fixture-property-documents",
      label: "Dummy indexed source files",
      pass: propertiesWithoutSourceFiles(fixtures).length === 0,
      passDetail: "Each dummy property has at least one Markdown source document.",
      missingDetail: `Add at least one supported source document for: ${propertiesWithoutSourceFiles(
        fixtures,
      ).join(", ")}`,
    }),
    manualCheck({
      id: "clerk-restricted-mode",
      label: "Clerk restricted mode",
      detail:
        "Confirm Clerk is restricted or invitation-only before sending the hosted URL outside the alpha tester's test account.",
    }),
    ...(!hasGoogleOAuthCredentials
      ? [
          manualCheck({
            id: "google-cloud-2sv",
            label: "Google Cloud OAuth setup",
            detail:
              `Confirm 2-step verification is enabled for ${alphaTesterEmail}, then finish Google Auth Platform setup and create the Almanac OAuth client.`,
          }),
        ]
      : []),
    manualCheck({
      id: "dummy-drive-upload",
      label: "Dummy Drive portfolio",
      detail:
        `Use the populated ${almanacTestPortfolio.driveFolderName} folder under ${alphaTesterEmail} for hosted sync testing: ${almanacTestPortfolio.driveFolderUrl}. Use ${almanacTestPortfolio.masterSpreadsheetName} (${almanacTestPortfolio.sheetTabName}): ${almanacTestPortfolio.masterSpreadsheetUrl}.`,
    }),
    manualCheck({
      id: "operator-invite-email",
      label: "operator invite email",
      detail:
        "After the alpha tester's dummy-file test passes, add the operator's real email to ALMANAC_ALLOWED_EMAILS and invite him through Clerk.",
    }),
    manualCheck({
      id: "alpha-dummy-test",
      label: "Alpha tester dummy data smoke test",
      detail:
        "Run onboarding, sync, search, assistant, document generation, review, and print against the alpha tester's dummy Google Drive data before inviting the operator.",
    }),
  ];

  const blockers = checks.filter((check) => check.status === "missing");
  const warnings = checks.filter((check) => check.status === "warning");
  const manualChecks = checks.filter((check) => check.status === "manual");

  return {
    readyForHostedAlphaTest: blockers.length === 0,
    blockers,
    warnings,
    manualChecks,
    nextActions: blockers.length > 0 ? blockers : manualChecks,
    checks,
  };
}

function requiredCheck({
  id,
  label,
  pass,
  passDetail,
  missingDetail,
}: {
  id: string;
  label: string;
  pass: boolean;
  passDetail: string;
  missingDetail: string;
}): ReadinessCheck {
  return {
    id,
    label,
    status: pass ? "pass" : "missing",
    detail: pass ? passDetail : missingDetail,
  };
}

function warningCheck({
  id,
  label,
  pass,
  passDetail,
  warningDetail,
}: {
  id: string;
  label: string;
  pass: boolean;
  passDetail: string;
  warningDetail: string;
}): ReadinessCheck {
  return {
    id,
    label,
    status: pass ? "pass" : "warning",
    detail: pass ? passDetail : warningDetail,
  };
}

function manualCheck({
  id,
  label,
  detail,
}: {
  id: string;
  label: string;
  detail: string;
}): ReadinessCheck {
  return {
    id,
    label,
    status: "manual",
    detail,
  };
}

function diagnosticCheck(value: string | undefined): ReadinessCheck {
  if ((value || "disabled").trim() === "enabled") {
    return {
      id: "google-optional-diagnostics",
      label: "Optional Google diagnostics",
      status: "warning",
      detail:
        "GOOGLE_OPTIONAL_DIAGNOSTICS is enabled. Disable it for the operator's first alpha unless Calendar or Gmail metadata diagnostics are needed.",
    };
  }

  return {
    id: "google-optional-diagnostics",
    label: "Optional Google diagnostics",
    status: "pass",
    detail: "Optional Calendar and Gmail diagnostics are disabled.",
  };
}

function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

function isPostgresUrl(value: string | undefined): boolean {
  return Boolean(value && /^postgres(ql)?:\/\//.test(value.trim()));
}

function isGoogleCallbackUrl(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.pathname === "/api/google/callback";
  } catch {
    return false;
  }
}

function normalizedEmails(value: string | undefined): string[] {
  return (value || "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function missingExpectedProperties(propertyFolders: string[]): string[] {
  const normalizedFolders = new Set(propertyFolders.map((folder) => folder.trim()));
  return expectedAlmanacFixtureInventory.expectedProperties.filter(
    (property) => !normalizedFolders.has(property),
  );
}

function propertiesWithoutSourceFiles(fixtures: FixtureInventory): string[] {
  return expectedAlmanacFixtureInventory.expectedProperties.filter((property) => {
    const sourceFiles = fixtures.sourceFilesByProperty[property] || [];
    return sourceFiles.length === 0;
  });
}
