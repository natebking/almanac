import { describe, expect, it } from "vitest";
import { alphaTesterEmail } from "@/lib/alpha-config";
import {
  buildHostedDummySeedPlan,
  formatHostedDummySeedPlan,
  validateHostedDummySeedTarget,
} from "@/lib/fixtures/hosted-dummy-seed";

describe("hosted dummy seed plan", () => {
  it("only allows the alpha tester's hosted test Google account by default", () => {
    expect(
      validateHostedDummySeedTarget({
        targetEmail: alphaTesterEmail,
        allowedEmails: `${alphaTesterEmail}, operator@example.com`,
      }),
    ).toBe(alphaTesterEmail);

    expect(() =>
      validateHostedDummySeedTarget({
        targetEmail: "operator@example.com",
        allowedEmails: `${alphaTesterEmail}, operator@example.com`,
      }),
    ).toThrow("Refusing to seed hosted dummy data for operator@example.com.");
  });

  it("requires the target email to be in the hosted allowlist", () => {
    expect(() =>
      validateHostedDummySeedTarget({
        targetEmail: alphaTesterEmail,
        allowedEmails: "operator@example.com",
      }),
    ).toThrow("ALMANAC_ALLOWED_EMAILS must include alpha-tester@example.com.");
  });

  it("describes the hosted dummy portfolio inventory", () => {
    const plan = buildHostedDummySeedPlan(alphaTesterEmail);

    expect(plan.targetEmail).toBe(alphaTesterEmail);
    expect(plan.counts).toEqual({
      properties: 5,
      profiles: 5,
      driveFiles: 12,
      vendors: 2,
      templates: 3,
      generatedDocuments: 1,
    });
    expect(plan.propertyAddresses).toEqual([
      "161 Loch Lomand Drive",
      "22 Verona Court",
      "48 St. Paul Street",
      "9 Wood Court",
      "77 Estates Lane",
    ]);
    expect(plan.templateNames).toEqual([
      "Move-In Checklist",
      "Utility Transfer Letter",
      "Welcome Letter",
    ]);
  });

  it("formats a short operator-facing seed preview", () => {
    const formatted = formatHostedDummySeedPlan(
      buildHostedDummySeedPlan(alphaTesterEmail),
    );

    expect(formatted).toContain("Target user: alpha-tester@example.com");
    expect(formatted).toContain("- Properties: 5");
    expect(formatted).toContain("- Drive files: 12");
    expect(formatted).toContain("161 Loch Lomand Drive");
  });
});
