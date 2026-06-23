import { describe, expect, it } from "vitest";
import { extractPlaceholders, replacePlaceholders } from "@/lib/placeholders";

describe("placeholders", () => {
  it("extracts unique placeholders in display order", () => {
    expect(
      extractPlaceholders(
        "Hello {{tenant_name}} at {{property_address}}. Hi {{tenant_name}}.",
      ),
    ).toEqual(["tenant_name", "property_address"]);
  });

  it("replaces known placeholders and leaves unknown placeholders visible", () => {
    expect(
      replacePlaceholders("Move in: {{move_in_date}}. Missing: {{deposit}}.", {
        move_in_date: "July 1, 2026",
      }),
    ).toBe("Move in: July 1, 2026. Missing: {{deposit}}.");
  });

  it("replaces known blank placeholders with empty text", () => {
    expect(
      replacePlaceholders("Move in: {{move_in_date}}. Filter: {{filter_size}}.", {
        move_in_date: "",
        filter_size: "",
      }),
    ).toBe("Move in: . Filter: .");
  });
});
