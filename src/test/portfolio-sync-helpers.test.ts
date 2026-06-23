import { describe, expect, it } from "vitest";
import type { GoogleDriveFileMetadata } from "@/lib/google/types";
import {
  categorizeDriveFile,
  findPropertyForDriveName,
  findStaleDriveFileIds,
  planDocumentTemplateRows,
  planDriveFileRows,
  planPropertyProfileRow,
  planSpreadsheetRows,
} from "@/lib/sync/portfolio-sync-helpers";

const folder = {
  id: "folder_loch",
  name: "Loch Lomand",
  mimeType: "application/vnd.google-apps.folder",
  webViewLink: "https://drive.google.com/drive/folders/folder_loch",
  modifiedTime: "2026-06-01T12:00:00.000Z",
} satisfies GoogleDriveFileMetadata;

const properties = [
  {
    id: "property_loch",
    address: "Loch Lomand",
    normalizedAddress: "loch lomand",
  },
  {
    id: "property_wood",
    address: "Wood Court",
    normalizedAddress: "wood court",
  },
];

describe("portfolio sync helpers", () => {
  it("categorizes Drive files from operator-style names", () => {
    expect(categorizeDriveFile({ ...folder, name: "Move-In Checklist Template" })).toBe(
      "template",
    );
    expect(categorizeDriveFile({ ...folder, name: "Loch Lomand Lease" })).toBe(
      "lease",
    );
    expect(categorizeDriveFile({ ...folder, name: "Verona Application" })).toBe(
      "application",
    );
    expect(categorizeDriveFile({ ...folder, name: "Wood Court Photos" })).toBe(
      "photos",
    );
    expect(categorizeDriveFile({ ...folder, name: "Estates HVAC Repair Invoice" })).toBe(
      "maintenance",
    );
    expect(categorizeDriveFile({ ...folder, name: "St. Paul Owner Statement" })).toBe(
      "financial",
    );
    expect(categorizeDriveFile({ ...folder, name: "Wood Court Remodel Scope" })).toBe(
      "project",
    );
    expect(categorizeDriveFile({ ...folder, name: "Tenant Overview" })).toBe(
      "material",
    );
    expect(categorizeDriveFile({ ...folder, name: "Archive Folder" })).toBe("folder");
  });

  it("matches Drive names to indexed properties by normalized address", () => {
    expect(findPropertyForDriveName("Loch Lomand", properties)?.id).toBe(
      "property_loch",
    );
    expect(findPropertyForDriveName("2026 Loch Lomand Lease", properties)?.id).toBe(
      "property_loch",
    );
    expect(findPropertyForDriveName("Move-In Checklist", properties)).toBeNull();
  });

  it("plans spreadsheet rows from a Sheets values matrix", () => {
    const rows = planSpreadsheetRows({
      spreadsheetId: "sheet_123",
      sheetName: "Rentals",
      values: [
        ["Property Address", "Current Tenant(s)", "Rent Amount", "Status"],
        ["Loch Lomand", "Avery Johnson", "$2,450", "Active"],
      ],
    });

    expect(rows).toMatchObject([
      {
        sourceSpreadsheetId: "sheet_123",
        sourceSheetName: "Rentals",
        sourceRowNumber: 2,
        address: "Loch Lomand",
        currentTenants: "Avery Johnson",
        rentAmount: "$2,450",
        status: "Active",
      },
    ]);
  });

  it("plans property profile rows from optional spreadsheet profile values", () => {
    const [row] = planSpreadsheetRows({
      spreadsheetId: "sheet_123",
      sheetName: "Rentals",
      values: [
        [
          "Property Address",
          "Tenant",
          "Filter Size",
          "Warranty Notes",
          "Access Codes",
        ],
        [
          "Loch Lomand",
          "Avery Johnson",
          "16x20x1",
          "Choice Home Warranty through 2027-01-15.",
          "Gate: 2468.",
        ],
      ],
    });

    expect(
      planPropertyProfileRow({
        row,
        userId: "user_1",
        propertyIndexId: "property_loch",
      }),
    ).toEqual({
      userId: "user_1",
      propertyIndexId: "property_loch",
      applianceInfo: "",
      filterSize: "16x20x1",
      homeWarranty: "Choice Home Warranty through 2027-01-15.",
      hoaInfo: "",
      utilityProviders: "",
      accessCodes: "Gate: 2468.",
    });
  });

  it("skips property profile rows when the spreadsheet row has no profile values", () => {
    const [row] = planSpreadsheetRows({
      spreadsheetId: "sheet_123",
      sheetName: "Rentals",
      values: [
        ["Property Address", "Tenant"],
        ["Wood Court", ""],
      ],
    });

    expect(
      planPropertyProfileRow({
        row,
        userId: "user_1",
        propertyIndexId: "property_wood",
      }),
    ).toBeNull();
  });

  it("refuses spreadsheet planning without a header row", () => {
    expect(() =>
      planSpreadsheetRows({
        spreadsheetId: "sheet_123",
        sheetName: "Rentals",
        values: [],
      }),
    ).toThrow("The master spreadsheet returned no header row.");
  });

  it("plans Drive file rows and links property-folder children to the property", () => {
    const rows = planDriveFileRows({
      sourceConnectionId: "drive_source",
      userId: "user_1",
      properties,
      rootFiles: [folder],
      filesByFolderId: {
        folder_loch: [
          {
            id: "lease_loch",
            name: "Lease",
            mimeType: "application/pdf",
            webViewLink: "https://drive.google.com/file/d/lease_loch",
            modifiedTime: "2026-06-02T12:00:00.000Z",
          },
        ],
      },
    });

    expect(rows).toEqual([
      {
        userId: "user_1",
        sourceConnectionId: "drive_source",
        propertyIndexId: "property_loch",
        googleFileId: "lease_loch",
        name: "Lease",
        mimeType: "application/pdf",
        category: "lease",
        webViewLink: "https://drive.google.com/file/d/lease_loch",
        modifiedTime: new Date("2026-06-02T12:00:00.000Z"),
        textExtract: "",
      },
    ]);
  });

  it("plans non-property root folder descendants without a property link", () => {
    const rows = planDriveFileRows({
      sourceConnectionId: "drive_source",
      userId: "user_1",
      properties,
      rootFiles: [
        {
          ...folder,
          id: "folder_templates",
          name: "Templates",
          webViewLink: "https://drive.google.com/drive/folders/folder_templates",
        },
      ],
      filesByFolderId: {
        folder_templates: [
          {
            id: "template_move_in",
            name: "Move-In Checklist Template",
            mimeType: "application/vnd.google-apps.document",
            webViewLink: "https://docs.google.com/document/d/template_move_in",
            modifiedTime: "2026-06-03T12:00:00.000Z",
          },
        ],
      },
    });

    expect(rows).toEqual([
      {
        userId: "user_1",
        sourceConnectionId: "drive_source",
        propertyIndexId: null,
        googleFileId: "folder_templates",
        name: "Templates",
        mimeType: "application/vnd.google-apps.folder",
        category: "template",
        webViewLink: "https://drive.google.com/drive/folders/folder_templates",
        modifiedTime: new Date("2026-06-01T12:00:00.000Z"),
        textExtract: "",
      },
      {
        userId: "user_1",
        sourceConnectionId: "drive_source",
        propertyIndexId: null,
        googleFileId: "template_move_in",
        name: "Move-In Checklist Template",
        mimeType: "application/vnd.google-apps.document",
        category: "template",
        webViewLink: "https://docs.google.com/document/d/template_move_in",
        modifiedTime: new Date("2026-06-03T12:00:00.000Z"),
        textExtract: "",
      },
    ]);
  });

  it("finds stale Drive file IDs that are no longer in the current sync plan", () => {
    expect(
      findStaleDriveFileIds({
        existingGoogleFileIds: ["lease_loch", "old_notice", "old_notice"],
        plannedRows: [
          {
            userId: "user_1",
            sourceConnectionId: "drive_source",
            propertyIndexId: "property_loch",
            googleFileId: "lease_loch",
            name: "Lease",
            mimeType: "application/pdf",
            category: "lease",
            webViewLink: "https://drive.google.com/file/d/lease_loch",
            modifiedTime: new Date("2026-06-02T12:00:00.000Z"),
            textExtract: "",
          },
        ],
      }),
    ).toEqual(["old_notice"]);
  });

  it("plans Google Docs templates from text-extracted Drive template rows", () => {
    expect(
      planDocumentTemplateRows({
        userId: "user_1",
        driveRows: [
          {
            userId: "user_1",
            sourceConnectionId: "drive_source",
            propertyIndexId: null,
            googleFileId: "template_move_in",
            name: "Move-In Checklist",
            mimeType: "application/vnd.google-apps.document",
            category: "template",
            webViewLink: "https://docs.google.com/document/d/template_move_in",
            modifiedTime: new Date("2026-06-03T12:00:00.000Z"),
            textExtract:
              "Tenant: {{tenant_name}}\nProperty: {{property_address}}\nMove-in: {{move_in_date}}",
          },
        ],
      }),
    ).toEqual([
      {
        userId: "user_1",
        name: "Move-In Checklist",
        description: "Synced from Google Drive template.",
        googleDocId: "template_move_in",
        googleDocUrl: "https://docs.google.com/document/d/template_move_in",
        localBody:
          "Tenant: {{tenant_name}}\nProperty: {{property_address}}\nMove-in: {{move_in_date}}",
        placeholders: JSON.stringify([
          "tenant_name",
          "property_address",
          "move_in_date",
        ]),
      },
    ]);
  });

  it("uses clean template names for Google Docs ending in Template", () => {
    expect(
      planDocumentTemplateRows({
        userId: "user_1",
        driveRows: [
          {
            userId: "user_1",
            sourceConnectionId: "drive_source",
            propertyIndexId: null,
            googleFileId: "template_move_in",
            name: "Move-In Checklist Template",
            mimeType: "application/vnd.google-apps.document",
            category: "template",
            webViewLink: "https://docs.google.com/document/d/template_move_in",
            modifiedTime: null,
            textExtract: "Tenant: {{tenant_name}}",
          },
        ],
      })[0]?.name,
    ).toBe("Move-In Checklist");
  });

  it("skips non-Google Docs templates and templates without extracted text", () => {
    expect(
      planDocumentTemplateRows({
        userId: "user_1",
        driveRows: [
          {
            userId: "user_1",
            sourceConnectionId: "drive_source",
            propertyIndexId: null,
            googleFileId: "template_pdf",
            name: "Move-In Checklist PDF",
            mimeType: "application/pdf",
            category: "template",
            webViewLink: "https://drive.google.com/file/d/template_pdf",
            modifiedTime: null,
            textExtract: "Tenant: {{tenant_name}}",
          },
          {
            userId: "user_1",
            sourceConnectionId: "drive_source",
            propertyIndexId: null,
            googleFileId: "template_empty",
            name: "Welcome Letter",
            mimeType: "application/vnd.google-apps.document",
            category: "template",
            webViewLink: "https://docs.google.com/document/d/template_empty",
            modifiedTime: null,
            textExtract: "",
          },
        ],
      }),
    ).toEqual([]);
  });
});
