import { describe, expect, it } from "vitest";
import { alphaTesterEmail } from "@/lib/alpha-config";
import { assessClerkAccessReadiness } from "@/lib/clerk-access-readiness";

describe("Clerk access readiness", () => {
  it("passes private alpha access when the alpha tester is allowed, signed in, and restricted mode is confirmed", () => {
    const report = assessClerkAccessReadiness({
      allowedEmails: [alphaTesterEmail],
      userEmails: [alphaTesterEmail],
      invitationEmails: [],
      restrictedToAllowlist: true,
    });

    expect(report.readyForPrivateAlpha).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.manualChecks).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.checks.map((check) => [check.id, check.status])).toEqual([
      ["almanac-allowed-emails", "pass"],
      ["clerk-alpha-tester-access", "pass"],
      ["clerk-extra-users", "pass"],
      ["clerk-restricted-mode", "pass"],
    ]);
  });

  it("keeps restricted mode manual when the Clerk API cannot read that dashboard setting", () => {
    const report = assessClerkAccessReadiness({
      allowedEmails: [alphaTesterEmail],
      userEmails: [alphaTesterEmail],
      invitationEmails: [],
      restrictedToAllowlist: null,
    });

    expect(report.readyForPrivateAlpha).toBe(false);
    expect(report.blockers).toEqual([]);
    expect(report.manualChecks.map((check) => check.id)).toEqual([
      "clerk-restricted-mode",
    ]);
    expect(report.nextActions.map((check) => check.id)).toEqual([
      "clerk-restricted-mode",
    ]);
    expect(report.manualChecks[0]?.detail).toContain(
      "Almanac still rejects unallowlisted users at the app layer",
    );
  });

  it("blocks private alpha access when the alpha tester is not allowed or invited in Clerk", () => {
    const report = assessClerkAccessReadiness({
      allowedEmails: ["operator@example.com"],
      userEmails: ["operator@example.com"],
      invitationEmails: [],
      restrictedToAllowlist: true,
    });

    expect(report.readyForPrivateAlpha).toBe(false);
    expect(report.blockers.map((check) => check.id)).toEqual([
      "almanac-allowed-emails",
      "clerk-alpha-tester-access",
    ]);
    expect(
      report.blockers.find((check) => check.id === "almanac-allowed-emails")
        ?.detail,
    ).toContain(alphaTesterEmail);
  });

  it("warns about Clerk users outside the Almanac alpha allowlist", () => {
    const report = assessClerkAccessReadiness({
      allowedEmails: [alphaTesterEmail],
      userEmails: [alphaTesterEmail, "stray@example.com"],
      invitationEmails: [],
      restrictedToAllowlist: true,
    });

    expect(report.readyForPrivateAlpha).toBe(true);
    expect(report.warnings.map((check) => check.id)).toEqual([
      "clerk-extra-users",
    ]);
    expect(
      report.warnings.find((check) => check.id === "clerk-extra-users")?.detail,
    ).toContain("stray@example.com");
  });
});
