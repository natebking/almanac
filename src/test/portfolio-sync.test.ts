import { describe, expect, it } from "vitest";
import type { GoogleWorkspaceAdapter } from "@/lib/google/types";
import {
  buildSeededFixtureTemplateCleanupWhere,
  buildSeededFixtureDuplicatePropertyCleanupWhere,
  listDriveFilesRecursively,
  mergeSourceMetadataForSync,
  syncDocumentTemplatesFromDriveRows,
  validatePortfolioSyncSetup,
} from "@/lib/sync/portfolio-sync";

describe("validatePortfolioSyncSetup", () => {
  it("requires real Google mode and configured source IDs before sync", () => {
    expect(() =>
      validatePortfolioSyncSetup({
        googleMode: "local",
        spreadsheetId: "sheet_123",
        sheetName: "Rentals",
        driveRootFolderId: "folder_123",
        hasConnectedAccount: true,
      }),
    ).toThrow("Portfolio sync requires GOOGLE_MODE=real.");

    expect(() =>
      validatePortfolioSyncSetup({
        googleMode: "real",
        spreadsheetId: "",
        sheetName: "Rentals",
        driveRootFolderId: "folder_123",
        hasConnectedAccount: true,
      }),
    ).toThrow("GOOGLE_MASTER_SPREADSHEET_ID is required.");

    expect(() =>
      validatePortfolioSyncSetup({
        googleMode: "real",
        spreadsheetId: "sheet_123",
        sheetName: "Rentals",
        driveRootFolderId: "",
        hasConnectedAccount: true,
      }),
    ).toThrow("GOOGLE_TEST_ROOT_FOLDER_ID is required.");

    expect(() =>
      validatePortfolioSyncSetup({
        googleMode: "real",
        spreadsheetId: "sheet_123",
        sheetName: "Rentals",
        driveRootFolderId: "folder_123",
        hasConnectedAccount: false,
      }),
    ).toThrow("Google account is not connected.");
  });
});

describe("source metadata sync helpers", () => {
  it("preserves settings metadata when sync stores fresh counts", () => {
    const merged = mergeSourceMetadataForSync(
      JSON.stringify({
        configuredBy: "settings",
        sheetName: "Rentals",
        sourceOfTruth: true,
      }),
      {
        rowsSynced: 5,
        sheetName: "Rentals",
      },
    );

    expect(merged).toEqual({
      configuredBy: "settings",
      sheetName: "Rentals",
      sourceOfTruth: true,
      rowsSynced: 5,
    });
  });

  it("builds a cleanup filter only for seeded fixture duplicates", () => {
    expect(
      buildSeededFixtureDuplicatePropertyCleanupWhere({
        userId: "user_1",
        activeSourceConnectionId: "source_real",
        normalizedAddresses: ["161 loch lomand drive", "22 verona court"],
      }),
    ).toEqual({
      userId: "user_1",
      sourceConnectionId: { not: "source_real" },
      normalizedAddress: {
        in: ["161 loch lomand drive", "22 verona court"],
      },
      sourceConnection: {
        is: {
          metadataJson: { contains: "almanac-hosted-dummy" },
        },
      },
    });
  });

  it("skips seeded fixture cleanup when there are no synced addresses", () => {
    expect(
      buildSeededFixtureDuplicatePropertyCleanupWhere({
        userId: "user_1",
        activeSourceConnectionId: "source_real",
        normalizedAddresses: [],
      }),
    ).toBeNull();
  });

  it("builds a cleanup filter for seeded fixture templates after real templates sync", () => {
    expect(
      buildSeededFixtureTemplateCleanupWhere({
        userId: "user_1",
        syncedTemplateCount: 3,
      }),
    ).toEqual({
      userId: "user_1",
      googleDocId: {
        in: [
          "template-move-in-checklist",
          "template-utility-transfer-letter",
          "template-welcome-letter",
        ],
      },
    });
  });

  it("skips seeded fixture template cleanup when no real templates synced", () => {
    expect(
      buildSeededFixtureTemplateCleanupWhere({
        userId: "user_1",
        syncedTemplateCount: 0,
      }),
    ).toBeNull();
  });
});

describe("syncDocumentTemplatesFromDriveRows", () => {
  it("creates new Google Docs templates from text-extracted Drive template rows", async () => {
    const created: unknown[] = [];
    const store = {
      documentTemplate: {
        findFirst: async () => null,
        update: async () => {
          throw new Error("Update should not be called.");
        },
        create: async (input: unknown) => {
          created.push(input);
          return input;
        },
      },
    };

    const count = await syncDocumentTemplatesFromDriveRows({
      store,
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
          textExtract: "Tenant: {{tenant_name}}\nProperty: {{property_address}}",
        },
      ],
    });

    expect(count).toBe(1);
    expect(created).toEqual([
      {
        data: {
          userId: "user_1",
          name: "Move-In Checklist",
          description: "Synced from Google Drive template.",
          googleDocId: "template_move_in",
          googleDocUrl: "https://docs.google.com/document/d/template_move_in",
          localBody: "Tenant: {{tenant_name}}\nProperty: {{property_address}}",
          placeholders: JSON.stringify(["tenant_name", "property_address"]),
        },
      },
    ]);
  });

  it("updates an existing synced template by Google Doc ID", async () => {
    const updated: unknown[] = [];
    const store = {
      documentTemplate: {
        findFirst: async () => ({ id: "template_existing" }),
        update: async (input: unknown) => {
          updated.push(input);
          return input;
        },
        create: async () => {
          throw new Error("Create should not be called.");
        },
      },
    };

    const count = await syncDocumentTemplatesFromDriveRows({
      store,
      userId: "user_1",
      driveRows: [
        {
          userId: "user_1",
          sourceConnectionId: "drive_source",
          propertyIndexId: null,
          googleFileId: "template_welcome",
          name: "Welcome Letter",
          mimeType: "application/vnd.google-apps.document",
          category: "template",
          webViewLink: "https://docs.google.com/document/d/template_welcome",
          modifiedTime: null,
          textExtract: "Hello {{tenant_name}}",
        },
      ],
    });

    expect(count).toBe(1);
    expect(updated).toEqual([
      {
        where: { id: "template_existing" },
        data: {
          name: "Welcome Letter",
          description: "Synced from Google Drive template.",
          googleDocUrl: "https://docs.google.com/document/d/template_welcome",
          localBody: "Hello {{tenant_name}}",
          placeholders: JSON.stringify(["tenant_name"]),
        },
      },
    ]);
  });
});

describe("listDriveFilesRecursively", () => {
  it("includes documents nested inside property subfolders", async () => {
    const adapter = nestedDriveAdapter({
      folder_loch: [
        {
          id: "folder_leases",
          name: "Leases",
          mimeType: "application/vnd.google-apps.folder",
          webViewLink: "https://drive.google.com/drive/folders/folder_leases",
          modifiedTime: null,
        },
      ],
      folder_leases: [
        {
          id: "doc_lease",
          name: "Loch Lomand Lease 2026",
          mimeType: "application/vnd.google-apps.document",
          webViewLink: "https://docs.google.com/document/d/doc_lease",
          modifiedTime: "2026-06-18T12:00:00.000Z",
        },
      ],
    });

    const files = await listDriveFilesRecursively(adapter, "folder_loch");

    expect(files.map((file) => file.id)).toEqual(["folder_leases", "doc_lease"]);
  });
});

function nestedDriveAdapter(
  filesByFolderId: Record<
    string,
    Awaited<ReturnType<GoogleWorkspaceAdapter["listDriveFiles"]>>["files"]
  >,
): GoogleWorkspaceAdapter {
  return {
    async listDriveFiles(input) {
      return {
        files: filesByFolderId[input.folderId] ?? [],
        nextPageToken: null,
      };
    },
    async generateDocument() {
      throw new Error("generateDocument is not used in this test.");
    },
    async readSpreadsheetValues() {
      throw new Error("readSpreadsheetValues is not used in this test.");
    },
    async listSourceCandidates() {
      throw new Error("listSourceCandidates is not used in this test.");
    },
    async exportDriveFileText() {
      throw new Error("exportDriveFileText is not used in this test.");
    },
    async exportDriveFilePdf() {
      throw new Error("exportDriveFilePdf is not used in this test.");
    },
    async listCalendarEvents() {
      throw new Error("listCalendarEvents is not used in this test.");
    },
    async listGmailMessageHeaders() {
      throw new Error("listGmailMessageHeaders is not used in this test.");
    },
  };
}
