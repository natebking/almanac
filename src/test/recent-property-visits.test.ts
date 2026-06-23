import { describe, expect, it } from "vitest";
import { buildRecentPropertyCards } from "@/lib/dashboard/recent-properties";

describe("buildRecentPropertyCards", () => {
  it("builds most-recent-first dashboard cards from property visits", () => {
    const cards = buildRecentPropertyCards([
      {
        id: "visit_loch",
        openedAt: new Date("2026-06-17T12:00:00.000Z"),
        propertyIndex: {
          id: "property_loch",
          address: "Loch Lomand",
          currentTenants: "Avery Johnson",
          status: "Active",
        },
      },
      {
        id: "visit_orphan",
        openedAt: new Date("2026-06-17T12:30:00.000Z"),
        propertyIndex: null,
      },
      {
        id: "visit_wood",
        openedAt: new Date("2026-06-17T13:00:00.000Z"),
        propertyIndex: {
          id: "property_wood",
          address: "Wood Court",
          currentTenants: "",
          status: "Vacant",
        },
      },
    ]);

    expect(cards).toEqual([
      {
        id: "visit_wood",
        title: "Wood Court",
        subtitle: "Vacant",
        href: "/houses/property_wood",
        status: "Vacant",
        tone: "warning",
        openedAt: new Date("2026-06-17T13:00:00.000Z"),
      },
      {
        id: "visit_loch",
        title: "Loch Lomand",
        subtitle: "Avery Johnson",
        href: "/houses/property_loch",
        status: "Active",
        tone: "success",
        openedAt: new Date("2026-06-17T12:00:00.000Z"),
      },
    ]);
  });
});
