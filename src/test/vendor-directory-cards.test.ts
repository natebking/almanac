import { describe, expect, it } from "vitest";
import { buildVendorDirectoryCards } from "@/lib/vendors/directory-cards";

describe("buildVendorDirectoryCards", () => {
  it("builds contact, property, compliance, and related-work cards", () => {
    const cards = buildVendorDirectoryCards({
      vendors: [
        {
          id: "vendor_plumbing",
          name: "Reliable Plumbing",
          trade: "Plumbing",
          phone: "555-0101",
          email: "dispatch@reliable.example",
          notes: "Fast response on leak calls.",
          licenseStatus: "License on file",
          insuranceStatus: "Insurance on file",
          propertyLinks: [
            {
              id: "link_loch",
              propertyIndexId: "property_loch",
              propertyIndex: {
                id: "property_loch",
                address: "Loch Lomand",
              },
              property: null,
            },
            {
              id: "link_verona",
              propertyIndexId: "property_verona",
              propertyIndex: {
                id: "property_verona",
                address: "Verona",
              },
              property: null,
            },
          ],
        },
      ],
      driveFiles: [
        {
          id: "file_recent",
          name: "Loch Lomand Dishwasher Repair",
          category: "maintenance",
          webViewLink: "https://drive.google.com/file/d/recent",
          propertyIndexId: "property_loch",
          modifiedTime: new Date("2026-06-10T12:00:00.000Z"),
        },
        {
          id: "file_old",
          name: "Verona Water Heater Estimate",
          category: "project",
          webViewLink: "https://drive.google.com/file/d/old",
          propertyIndexId: "property_verona",
          modifiedTime: new Date("2026-05-01T12:00:00.000Z"),
        },
        {
          id: "file_unlinked",
          name: "Estates HVAC Invoice",
          category: "maintenance",
          webViewLink: "https://drive.google.com/file/d/unlinked",
          propertyIndexId: "property_estates",
          modifiedTime: new Date("2026-06-12T12:00:00.000Z"),
        },
      ],
    });

    expect(cards).toEqual([
      {
        id: "vendor_plumbing",
        name: "Reliable Plumbing",
        trade: "Plumbing",
        notes: "Fast response on leak calls.",
        complianceTone: "success",
        complianceLabel: "License + insurance on file",
        contactActions: [
          { label: "Call", href: "tel:555-0101" },
          { label: "Email", href: "mailto:dispatch@reliable.example" },
        ],
        linkedProperties: [
          {
            id: "property_loch",
            label: "Loch Lomand",
            href: "/houses/property_loch",
          },
          {
            id: "property_verona",
            label: "Verona",
            href: "/houses/property_verona",
          },
        ],
        relatedWork: [
          {
            id: "file_recent",
            title: "Loch Lomand Dishwasher Repair",
            subtitle: "maintenance - Loch Lomand",
            href: "https://drive.google.com/file/d/recent",
          },
          {
            id: "file_old",
            title: "Verona Water Heater Estimate",
            subtitle: "project - Verona",
            href: "https://drive.google.com/file/d/old",
          },
        ],
      },
    ]);
  });
});
