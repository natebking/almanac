import { describe, expect, it } from "vitest";
import {
  getMasterSpreadsheetColumnGuide,
  parseMasterSpreadsheetRows,
} from "@/lib/spreadsheet/property-rows";

describe("parseMasterSpreadsheetRows", () => {
  it("maps the operator's master spreadsheet headers into property index rows", () => {
    const rows = parseMasterSpreadsheetRows({
      spreadsheetId: "sheet_123",
      sheetName: "Rentals",
      headers: [
        "Property Address",
        "Current Tenant(s)",
        "Rent Amount",
        "Lease Start",
        "Lease End",
        "Tenant Phone",
        "Tenant Email",
        "Tenant Birthday(s)",
        "Pets",
        "Owner",
        "Broker Split",
        "Tenant Notes",
        "Status",
      ],
      rows: [
        [
          "Loch Lomand",
          "Avery Johnson",
          "$2,450",
          "2026-01-01",
          "2026-12-31",
          "555-0144",
          "avery@example.com",
          "Avery Johnson: June 20",
          "1 dog",
          "Example Property Group",
          "70 / 30",
          "Prefers text messages.",
          "Active",
        ],
      ],
    });

    expect(rows).toEqual([
      {
        sourceSpreadsheetId: "sheet_123",
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
        profile: null,
        rawJson: JSON.stringify({
          "Property Address": "Loch Lomand",
          "Current Tenant(s)": "Avery Johnson",
          "Rent Amount": "$2,450",
          "Lease Start": "2026-01-01",
          "Lease End": "2026-12-31",
          "Tenant Phone": "555-0144",
          "Tenant Email": "avery@example.com",
          "Tenant Birthday(s)": "Avery Johnson: June 20",
          Pets: "1 dog",
          Owner: "Example Property Group",
          "Broker Split": "70 / 30",
          "Tenant Notes": "Prefers text messages.",
          Status: "Active",
        }),
      },
    ]);
  });

  it("maps optional profile columns from the operator's master spreadsheet", () => {
    const rows = parseMasterSpreadsheetRows({
      spreadsheetId: "sheet_123",
      sheetName: "Rentals",
      headers: [
        "Property Address",
        "Tenant",
        "Filter Size",
        "Home Warranty",
        "HOA",
        "Utility Providers",
        "Access Codes",
        "Appliances",
      ],
      rows: [
        [
          "Loch Lomand",
          "Avery Johnson",
          "16x20x1",
          "Choice Home Warranty through 2027-01-15.",
          "No HOA on file.",
          "Electric: City Power. Water: City Water.",
          "Gate: 2468. Garage: 1357.",
          "Fridge LG LFXS26973. Dishwasher Bosch 300.",
        ],
      ],
    });

    expect(rows[0].profile).toEqual({
      accessCodes: "Gate: 2468. Garage: 1357.",
      applianceInfo: "Fridge LG LFXS26973. Dishwasher Bosch 300.",
      filterSize: "16x20x1",
      homeWarranty: "Choice Home Warranty through 2027-01-15.",
      hoaInfo: "No HOA on file.",
      utilityProviders: "Electric: City Power. Water: City Water.",
    });
  });

  it("omits the profile object when no optional profile values are present", () => {
    const rows = parseMasterSpreadsheetRows({
      spreadsheetId: "sheet_123",
      sheetName: "Rentals",
      headers: ["Property Address", "Tenant"],
      rows: [["Wood Court", ""]],
    });

    expect(rows[0].profile).toBeNull();
  });
});

describe("getMasterSpreadsheetColumnGuide", () => {
  it("describes required and optional master spreadsheet columns from parser aliases", () => {
    const guide = getMasterSpreadsheetColumnGuide();
    const coreFields = guide.find((section) => section.title === "Core property columns");
    const profileFields = guide.find(
      (section) => section.title === "Optional property profile columns",
    );

    expect(coreFields?.fields).toContainEqual({
      label: "Property address",
      required: true,
      acceptedHeaders: ["Property Address", "Address", "Property"],
    });
    expect(coreFields?.fields).toContainEqual({
      label: "Tenant email",
      required: false,
      acceptedHeaders: ["Tenant Email", "Email"],
    });
    expect(coreFields?.fields).toContainEqual({
      label: "Tenant birthday(s)",
      required: false,
      acceptedHeaders: [
        "Tenant Birthdays",
        "Tenant Birthday",
        "Tenant Birthday(s)",
        "Birthdays",
        "Birthday",
      ],
    });
    expect(profileFields?.fields).toContainEqual({
      label: "Filter size",
      required: false,
      acceptedHeaders: ["Filter Size", "Filter", "HVAC Filter Size"],
    });
    expect(profileFields?.fields).toContainEqual({
      label: "Access codes",
      required: false,
      acceptedHeaders: [
        "Access Codes",
        "Access Gate Codes",
        "Codes",
        "Gate Code",
        "Garage Code",
        "Lockbox Code",
      ],
    });
  });
});
