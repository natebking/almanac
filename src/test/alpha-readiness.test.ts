import { describe, expect, it } from "vitest";
import {
  almanacTestPortfolio,
  alphaTesterEmail,
} from "@/lib/alpha-config";
import {
  assessAlphaReadiness,
  expectedAlmanacFixtureInventory,
  type AlphaReadinessEnv,
  type FixtureInventory,
} from "@/lib/alpha-readiness";

const completeEnv: AlphaReadinessEnv = {
  DATABASE_PROVIDER: "postgres",
  DATABASE_URL: "postgresql://almanac.example/neon",
  AUTH_MODE: "clerk",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fake",
  CLERK_SECRET_KEY: "sk_test_fake",
  ALMANAC_ALLOWED_EMAILS: "alpha-tester@example.com, operator@example.com",
  GOOGLE_MODE: "real",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  GOOGLE_REDIRECT_URI:
    "https://almanac-alpha.example.com/api/google/callback",
  GOOGLE_OPTIONAL_DIAGNOSTICS: "disabled",
  OPENAI_API_KEY: "sk-openai-fake",
};

const completeFixtures: FixtureInventory = {
  masterSpreadsheetExists: true,
  propertyFolders: ["Estates", "Loch Lomand", "St. Paul", "Verona", "Wood Court"],
  templateFiles: [
    "move-in-checklist-template.md",
    "utility-transfer-letter-template.md",
    "welcome-letter-template.md",
  ],
  sourceFilesByProperty: {
    Estates: ["Maintenance/estates-hvac-warranty.md"],
    "Loch Lomand": ["Leases/loch-lomand-lease-2026.md"],
    "St. Paul": ["Leases/st-paul-lease-2025.md"],
    Verona: ["Applications/verona-application-summary.md"],
    "Wood Court": ["Projects/wood-court-turnover-scope.md"],
  },
};

describe("alpha readiness", () => {
  it("blocks hosted testing when allowlisted users and Google OAuth are missing", () => {
    const report = assessAlphaReadiness({
      env: {
        ...completeEnv,
        ALMANAC_ALLOWED_EMAILS: "",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
      },
      fixtures: completeFixtures,
    });

    expect(report.readyForHostedAlphaTest).toBe(false);
    expect(report.blockers.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "allowed-users",
        "google-client-id",
        "google-client-secret",
      ]),
    );
    expect(report.nextActions.map((check) => check.id)).toEqual(
      report.blockers.map((check) => check.id),
    );
    expect(report.manualChecks.map((check) => check.id)).toContain(
      "google-cloud-2sv",
    );
    expect(
      report.manualChecks.find((check) => check.id === "google-cloud-2sv")
        ?.detail,
    ).toContain("alpha-tester@example.com");
  });

  it("passes hosted testing checks when production env and dummy fixtures are ready", () => {
    const report = assessAlphaReadiness({
      env: completeEnv,
      fixtures: completeFixtures,
    });

    expect(report.readyForHostedAlphaTest).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.nextActions.map((check) => check.id)).toEqual(
      report.manualChecks.map((check) => check.id),
    );
    expect(report.manualChecks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "clerk-restricted-mode",
        "dummy-drive-upload",
        "operator-invite-email",
        "alpha-dummy-test",
      ]),
    );
    expect(report.manualChecks.map((check) => check.id)).not.toContain(
      "google-cloud-2sv",
    );
    expect(
      report.manualChecks.find((check) => check.id === "dummy-drive-upload")
        ?.detail,
    ).toContain(almanacTestPortfolio.driveFolderName);
    expect(
      report.manualChecks.find((check) => check.id === "dummy-drive-upload")
        ?.detail,
    ).toContain(almanacTestPortfolio.driveFolderUrl);
    expect(
      report.manualChecks.find((check) => check.id === "dummy-drive-upload")
        ?.detail,
    ).toContain(almanacTestPortfolio.masterSpreadsheetName);
    expect(
      report.manualChecks.find((check) => check.id === "dummy-drive-upload")
        ?.detail,
    ).toContain(almanacTestPortfolio.masterSpreadsheetUrl);
    expect(
      report.manualChecks.find((check) => check.id === "dummy-drive-upload")
        ?.detail,
    ).toContain(alphaTesterEmail);
    expect(
      report.manualChecks.find((check) => check.id === "dummy-drive-upload")
        ?.detail,
    ).not.toContain("fixture-bundle");
  });

  it("blocks hosted testing when the alpha tester's test Google account is not allowlisted", () => {
    const report = assessAlphaReadiness({
      env: {
        ...completeEnv,
        ALMANAC_ALLOWED_EMAILS: "operator@example.com, assistant@example.com",
      },
      fixtures: completeFixtures,
    });

    expect(report.readyForHostedAlphaTest).toBe(false);
    expect(report.blockers.map((check) => check.id)).toContain(
      "allowed-users",
    );
    expect(
      report.blockers.find((check) => check.id === "allowed-users")?.detail,
    ).toContain("alpha-tester@example.com");
  });

  it("treats the OpenAI key as a warning because deterministic answers still work", () => {
    const report = assessAlphaReadiness({
      env: {
        ...completeEnv,
        OPENAI_API_KEY: "",
      },
      fixtures: completeFixtures,
    });

    expect(report.readyForHostedAlphaTest).toBe(true);
    expect(report.blockers.map((check) => check.id)).not.toContain("openai-key");
    expect(report.warnings.map((check) => check.id)).toContain("openai-key");
  });

  it("describes the expected dummy Almanac fixture inventory", () => {
    expect(expectedAlmanacFixtureInventory.expectedProperties).toEqual([
      "Estates",
      "Loch Lomand",
      "St. Paul",
      "Verona",
      "Wood Court",
    ]);
    expect(expectedAlmanacFixtureInventory.minimumTemplateFiles).toBe(3);
  });
});
