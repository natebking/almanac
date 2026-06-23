import { describe, expect, it } from "vitest";
import { buildPropertyVisitUpsertArgs } from "@/lib/property-visits";

describe("buildPropertyVisitUpsertArgs", () => {
  it("builds an upsert keyed by user and indexed property", () => {
    const openedAt = new Date("2026-06-17T14:00:00.000Z");

    expect(
      buildPropertyVisitUpsertArgs({
        userId: "user_alpha",
        propertyIndexId: "property_loch",
        openedAt,
      }),
    ).toEqual({
      where: {
        userId_propertyIndexId: {
          userId: "user_alpha",
          propertyIndexId: "property_loch",
        },
      },
      create: {
        userId: "user_alpha",
        propertyIndexId: "property_loch",
        openedAt,
      },
      update: {
        openedAt,
      },
    });
  });
});
