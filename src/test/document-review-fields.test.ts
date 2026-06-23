import { describe, expect, it } from "vitest";
import { buildDocumentReviewFields } from "@/lib/documents/review-fields";
import type { PropertyIndex } from "@/generated/prisma/client";

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

describe("buildDocumentReviewFields", () => {
  it("prefills review fields from selected spreadsheet-indexed property data", () => {
    expect(
      buildDocumentReviewFields({
        placeholders: [
          "tenant_name",
          "property_address",
          "rent_amount",
          "move_in_date",
        ],
        property: propertyIndex,
      }),
    ).toEqual([
      {
        key: "tenant_name",
        label: "Tenant Name",
        defaultValue: "Avery Johnson",
      },
      {
        key: "property_address",
        label: "Property Address",
        defaultValue: "Loch Lomand",
      },
      {
        key: "rent_amount",
        label: "Rent Amount",
        defaultValue: "$2,450",
      },
      {
        key: "move_in_date",
        label: "Move In Date",
        defaultValue: "2026-01-01",
      },
    ]);
  });

  it("prefills review fields from indexed property profile data", () => {
    expect(
      buildDocumentReviewFields({
        placeholders: ["tenant_name", "filter_size", "access_codes"],
        property: propertyIndexWithProfile,
      }),
    ).toEqual([
      {
        key: "tenant_name",
        label: "Tenant Name",
        defaultValue: "Avery Johnson",
      },
      {
        key: "filter_size",
        label: "Filter Size",
        defaultValue: "16x20x1",
      },
      {
        key: "access_codes",
        label: "Access Codes",
        defaultValue: "Gate: 2468.",
      },
    ]);
  });

  it("keeps review fields blank until a property is selected", () => {
    expect(
      buildDocumentReviewFields({
        placeholders: ["tenant_name", "property_address"],
        property: null,
      }),
    ).toEqual([
      { key: "tenant_name", label: "Tenant Name", defaultValue: "" },
      { key: "property_address", label: "Property Address", defaultValue: "" },
    ]);
  });
});
