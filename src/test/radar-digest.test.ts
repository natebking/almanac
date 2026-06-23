import { describe, expect, it } from "vitest";
import { buildWeeklyDigest } from "@/lib/radar/digest";
import {
  buildRadarObligations,
  type RadarProperty,
} from "@/lib/radar/obligations";

const today = new Date("2026-06-15T12:00:00.000Z");

function property(overrides: Partial<RadarProperty> & { id: string }): RadarProperty {
  return {
    address: `${overrides.id} Street`,
    leaseStart: "",
    leaseEnd: "",
    status: "Occupied",
    tenantBirthdays: "",
    currentTenants: "Tenant",
    tenantNotes: "",
    ...overrides,
  };
}

describe("buildWeeklyDigest", () => {
  const obligations = buildRadarObligations({
    today,
    properties: [
      property({ id: "p1", leaseEnd: "2026-07-05" }), // 20 days -> outside 7-day window
      property({ id: "p2", leaseEnd: "2026-06-20", tenantBirthdays: "June 18" }),
      property({ id: "p3", status: "Vacant" }),
      property({ id: "p4", leaseStart: "2026-06-25" }), // 10 days -> outside window
    ],
  });

  const digest = buildWeeklyDigest({ today, obligations, horizonDays: 7 });

  it("includes only this-week dated items plus ongoing vacancies", () => {
    expect(digest.itemCount).toBe(3);
    expect(digest.sections.map((section) => section.kind)).toEqual([
      "lease-expiry",
      "birthday",
      "vacancy",
    ]);
  });

  it("builds a subject and plain-text body", () => {
    expect(digest.subject).toBe("Almanac: 3 things this week");
    expect(digest.generatedFor).toBe("2026-06-15");
    expect(digest.text).toContain("Leases expiring:");
    expect(digest.text).toContain("Week of 2026-06-15");
  });

  it("reports a calm digest when nothing is due", () => {
    const empty = buildWeeklyDigest({ today, obligations: [], horizonDays: 7 });
    expect(empty.itemCount).toBe(0);
    expect(empty.sections).toHaveLength(0);
    expect(empty.subject).toContain("nothing needs attention");
    expect(empty.text).toContain("Nothing time-sensitive");
  });
});
