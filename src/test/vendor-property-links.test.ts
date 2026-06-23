import { describe, expect, it } from "vitest";
import {
  propertyIndexIdsFromFormData,
  vendorPropertyLinkCreateData,
} from "@/lib/vendors/property-links";

describe("vendor property link helpers", () => {
  it("deduplicates indexed property ids from form data", () => {
    const formData = new FormData();
    formData.append("propertyIndexIds", "property_loch");
    formData.append("propertyIndexIds", "property_loch");
    formData.append("propertyIndexIds", "property_estates");
    formData.append("propertyIndexIds", " ");

    expect(propertyIndexIdsFromFormData(formData)).toEqual([
      "property_loch",
      "property_estates",
    ]);
  });

  it("builds nested create data for indexed property links", () => {
    expect(
      vendorPropertyLinkCreateData(["property_loch", "property_estates"]),
    ).toEqual([
      { propertyIndexId: "property_loch" },
      { propertyIndexId: "property_estates" },
    ]);
  });
});
