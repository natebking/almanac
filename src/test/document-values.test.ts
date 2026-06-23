import { describe, expect, it } from "vitest";
import { buildDocumentFieldValues, humanizePlaceholder } from "@/lib/document-values";
import type { Property, PropertyIndex } from "@/generated/prisma/client";

const property = {
  id: "property_1",
  userId: "user_1",
  address: "123 Oak Street",
  ownerName: "Taylor Morgan",
  tenantName: "Jordan Lee",
  notes: "",
  driveFolderId: null,
  driveFolderUrl: null,
  utilityNotes: "Electric: City Power.",
  accessCodes: "Gate: 2468.",
  applianceNotes: "",
  filterSize: "16x20x1",
  warrantyNotes: "",
  hoaNotes: "",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} satisfies Property;

const propertyIndex = {
  id: "property_index_1",
  userId: "user_1",
  sourceConnectionId: "source_1",
  sourceSpreadsheetId: "sheet_1",
  sourceSheetName: "Rentals",
  sourceRowNumber: 2,
  address: "Loch Lomand",
  normalizedAddress: "loch lomand",
  currentTenants: "Avery Johnson",
  rentAmount: "$2,450",
  leaseStart: "2026-01-01",
  leaseEnd: "2026-12-31",
  tenantPhone: "555-0144",
  tenantEmail: "avery@example.com",
  tenantBirthdays: "Avery Johnson: June 20",
  pets: "1 dog",
  owner: "Example Property Group",
  brokerSplit: "70 / 30",
  tenantNotes: "Prefers text messages.",
  status: "Active",
  driveFolderId: "folder-loch-lomand",
  driveFolderUrl: "https://drive.google.com/drive/folders/folder-loch-lomand",
  rawJson: "{}",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} satisfies PropertyIndex;

const propertyIndexWithProfile = {
  ...propertyIndex,
  profile: {
    applianceInfo: "Fridge LG LFXS26973.",
    filterSize: "16x20x1",
    homeWarranty: "Choice Home Warranty through 2027-01-15.",
    hoaInfo: "No HOA on file.",
    utilityProviders: "Electric: City Power.",
    accessCodes: "Gate: 2468.",
  },
};

describe("document values", () => {
  it("uses property defaults when submitted fields are blank", () => {
    expect(
      buildDocumentFieldValues({
        placeholders: ["tenant_name", "property_address", "move_in_date"],
        property,
        submittedValues: {
          tenant_name: "",
          move_in_date: "July 1, 2026",
        },
      }),
    ).toEqual({
      tenant_name: "Jordan Lee",
      property_address: "123 Oak Street",
      move_in_date: "July 1, 2026",
    });
  });

  it("uses spreadsheet-indexed property defaults for generated documents", () => {
    expect(
      buildDocumentFieldValues({
        placeholders: [
          "tenant_name",
          "property_address",
          "owner_name",
          "rent_amount",
          "move_in_date",
          "lease_end",
          "tenant_phone",
          "tenant_birthdays",
          "pets",
          "tenant_notes",
        ],
        property: propertyIndex,
        submittedValues: {
          tenant_notes: "Bring two copies.",
        },
      }),
    ).toEqual({
      tenant_name: "Avery Johnson",
      property_address: "Loch Lomand",
      owner_name: "Example Property Group",
        rent_amount: "$2,450",
        move_in_date: "2026-01-01",
        lease_end: "2026-12-31",
      tenant_phone: "555-0144",
      tenant_birthdays: "Avery Johnson: June 20",
      pets: "1 dog",
      tenant_notes: "Bring two copies.",
    });
  });

  it("uses indexed property profile defaults for generated documents", () => {
    expect(
      buildDocumentFieldValues({
        placeholders: [
          "tenant_name",
          "property_address",
          "filter_size",
          "warranty_notes",
          "access_codes",
        ],
        property: propertyIndexWithProfile,
        submittedValues: {},
      }),
    ).toEqual({
      tenant_name: "Avery Johnson",
      property_address: "Loch Lomand",
      filter_size: "16x20x1",
      warranty_notes: "Choice Home Warranty through 2027-01-15.",
      access_codes: "Gate: 2468.",
    });
  });

  it("turns placeholder keys into readable labels", () => {
    expect(humanizePlaceholder("move_in_date")).toBe("Move In Date");
  });
});
