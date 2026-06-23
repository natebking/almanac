import { describe, expect, it } from "vitest";
import { buildHouseProfileItems } from "@/lib/houses/profile-summary";

describe("buildHouseProfileItems", () => {
  it("builds ordered profile facts for the house page", () => {
    const items = buildHouseProfileItems({
      applianceInfo: "Fridge LG LFXS26973. Dishwasher Bosch 300.",
      filterSize: "16x20x1",
      homeWarranty: "Choice Home Warranty through 2027-01-15.",
      hoaInfo: "No HOA on file.",
      utilityProviders: "Electric: City Power. Water: City Water.",
      accessCodes: "Gate: 2468. Garage: 1357.",
    });

    expect(items).toEqual([
      {
        label: "Appliances",
        value: "Fridge LG LFXS26973. Dishwasher Bosch 300.",
      },
      { label: "Filter size", value: "16x20x1" },
      {
        label: "Home warranty",
        value: "Choice Home Warranty through 2027-01-15.",
      },
      { label: "HOA", value: "No HOA on file." },
      {
        label: "Utilities",
        value: "Electric: City Power. Water: City Water.",
      },
      { label: "Codes", value: "Gate: 2468. Garage: 1357." },
    ]);
  });

  it("omits blank facts and returns an empty list for missing profiles", () => {
    expect(buildHouseProfileItems(null)).toEqual([]);
    expect(
      buildHouseProfileItems({
        applianceInfo: " ",
        filterSize: "20x25x1",
        homeWarranty: "",
        hoaInfo: "",
        utilityProviders: "",
        accessCodes: "",
      }),
    ).toEqual([{ label: "Filter size", value: "20x25x1" }]);
  });
});
