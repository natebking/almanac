import { describe, expect, it } from "vitest";
import {
  allowedUserEmails,
  hasAllowedUserEmails,
  isAllowedUserEmail,
  type AppEnv,
} from "@/lib/env";

function envWithAllowedEmails(value: string): AppEnv {
  return {
    DATABASE_URL: "file:./prisma/dev.db",
    AUTH_SECRET: "",
    AUTH_MODE: "clerk",
    ALMANAC_ALLOWED_EMAILS: value,
    APP_URL: "http://localhost:3000",
    GOOGLE_MODE: "local",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    GOOGLE_REDIRECT_URI: "http://localhost:3000/api/google/callback",
    GOOGLE_OPTIONAL_DIAGNOSTICS: "disabled",
    GOOGLE_TEST_ROOT_FOLDER_ID: "",
    GOOGLE_MASTER_SPREADSHEET_ID: "",
    GOOGLE_MASTER_SHEET_NAME: "Rentals",
    OPENAI_API_KEY: "",
    OPENAI_MODEL: "gpt-5.5",
  };
}

describe("env allowlist helpers", () => {
  it("normalizes comma and whitespace separated allowed emails", () => {
    const env = envWithAllowedEmails("alpha-tester@example.com, operator@example.com\n");

    expect(allowedUserEmails(env)).toEqual([
      "alpha-tester@example.com",
      "operator@example.com",
    ]);
    expect(hasAllowedUserEmails(env)).toBe(true);
    expect(isAllowedUserEmail("alpha-tester@example.com", env)).toBe(true);
    expect(isAllowedUserEmail("operator@example.com", env)).toBe(true);
    expect(isAllowedUserEmail("random@example.com", env)).toBe(false);
  });

  it("treats an empty allowlist as not configured", () => {
    const env = envWithAllowedEmails("  ");

    expect(allowedUserEmails(env)).toEqual([]);
    expect(hasAllowedUserEmails(env)).toBe(false);
    expect(isAllowedUserEmail("alpha-tester@example.com", env)).toBe(false);
  });
});
