import { describe, expect, it } from "vitest";
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

describe("buildRadarObligations", () => {
  const properties: RadarProperty[] = [
    property({ id: "p1", leaseEnd: "2026-07-05" }), // 20 days -> soon
    property({ id: "p2", leaseEnd: "2026-06-20", tenantBirthdays: "June 18" }), // 5 + 3 days
    property({ id: "p3", status: "Vacant", tenantNotes: "Turnover in progress" }),
    property({ id: "p4", leaseStart: "2026-06-25" }), // 10 days -> soon move-in
    property({ id: "p5", leaseEnd: "2027-06-01", tenantBirthdays: "December 25" }), // out of horizon
  ];

  const obligations = buildRadarObligations({ today, properties });

  it("surfaces only obligations inside each horizon", () => {
    const ids = obligations.map((item) => item.id);
    expect(ids).toEqual([
      "birthday-p2-0", // 3 days
      "lease-p2", // 5 days
      "vacancy-p3", // ongoing
      "move-in-p4", // 10 days
      "lease-p1", // 20 days
    ]);
  });

  it("excludes obligations beyond the horizon (far lease + far birthday)", () => {
    expect(obligations.some((item) => item.id.includes("p5"))).toBe(false);
  });

  it("assigns urgency tiers by days until due", () => {
    const byId = Object.fromEntries(obligations.map((item) => [item.id, item]));
    expect(byId["lease-p2"].urgency).toBe("this-week");
    expect(byId["lease-p2"].daysUntil).toBe(5);
    expect(byId["move-in-p4"].urgency).toBe("soon");
    expect(byId["lease-p1"].urgency).toBe("soon");
    expect(byId["birthday-p2-0"].urgency).toBe("this-week");
  });

  it("treats vacancy as an ongoing obligation with no due date", () => {
    const vacancy = obligations.find((item) => item.id === "vacancy-p3");
    expect(vacancy?.kind).toBe("vacancy");
    expect(vacancy?.urgency).toBe("ongoing");
    expect(vacancy?.daysUntil).toBeNull();
    expect(vacancy?.dueDate).toBeNull();
  });

  it("ignores blank and unparseable dates", () => {
    const result = buildRadarObligations({
      today,
      properties: [property({ id: "x", leaseEnd: "soon", tenantBirthdays: "n/a" })],
    });
    expect(result).toHaveLength(0);
  });
});
