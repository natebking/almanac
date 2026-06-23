import { describe, expect, it } from "vitest";
import {
  parsePortfolioSourceConfig,
  parseSinglePortfolioSourceConfig,
  resolvePortfolioSourceConfig,
} from "@/lib/sync/source-config";

const env = {
  GOOGLE_MODE: "real" as const,
  GOOGLE_MASTER_SPREADSHEET_ID: "env_sheet_12345678901234567890",
  GOOGLE_MASTER_SHEET_NAME: "Env Rentals",
  GOOGLE_TEST_ROOT_FOLDER_ID: "env_folder_12345678901234567890",
};

describe("portfolio source config", () => {
  it("parses Google source setup values from IDs or URLs", () => {
    expect(
      parsePortfolioSourceConfig({
        spreadsheetInput:
          "https://docs.google.com/spreadsheets/d/saved_sheet_12345678901234567890/edit",
        sheetName: "Rentals",
        driveRootInput:
          "https://drive.google.com/drive/folders/saved_folder_12345678901234567890",
      }),
    ).toEqual({
      spreadsheetId: "saved_sheet_12345678901234567890",
      sheetName: "Rentals",
      driveRootFolderId: "saved_folder_12345678901234567890",
    });
  });

  it("rejects missing spreadsheet and Drive root values", () => {
    expect(() =>
      parsePortfolioSourceConfig({
        spreadsheetInput: "",
        sheetName: "Rentals",
        driveRootInput: "saved_folder_12345678901234567890",
      }),
    ).toThrow("Master spreadsheet URL or ID is required.");

    expect(() =>
      parsePortfolioSourceConfig({
        spreadsheetInput: "saved_sheet_12345678901234567890",
        sheetName: "Rentals",
        driveRootInput: "",
      }),
    ).toThrow("Drive root folder URL or ID is required.");
  });

  it("resolves settings-saved sources before environment variables", () => {
    const resolved = resolvePortfolioSourceConfig({
      env,
      sources: [
        source({
          kind: "master-spreadsheet",
          googleFileId: "saved_sheet_12345678901234567890",
          metadataJson: JSON.stringify({
            configuredBy: "settings",
            sheetName: "Saved Rentals",
          }),
        }),
        source({
          kind: "drive-root",
          googleFileId: "saved_folder_12345678901234567890",
          metadataJson: JSON.stringify({ configuredBy: "settings" }),
        }),
      ],
    });

    expect(resolved).toMatchObject({
      spreadsheetId: "saved_sheet_12345678901234567890",
      sheetName: "Saved Rentals",
      driveRootFolderId: "saved_folder_12345678901234567890",
      sourceOrigin: "settings",
    });
  });

  it("falls back to environment variables when no settings sources exist", () => {
    expect(resolvePortfolioSourceConfig({ env, sources: [] })).toMatchObject({
      spreadsheetId: "env_sheet_12345678901234567890",
      sheetName: "Env Rentals",
      driveRootFolderId: "env_folder_12345678901234567890",
      sourceOrigin: "environment",
    });
  });

  it("does not treat seeded demo sources as configured settings", () => {
    const resolved = resolvePortfolioSourceConfig({
      env: {
        ...env,
        GOOGLE_MASTER_SPREADSHEET_ID: "",
        GOOGLE_TEST_ROOT_FOLDER_ID: "",
      },
      sources: [
        source({
          kind: "master-spreadsheet",
          googleFileId: "sample-master-spreadsheet",
          metadataJson: JSON.stringify({ sheetName: "Rentals" }),
        }),
        source({
          kind: "drive-root",
          googleFileId: "sample-drive-root",
          metadataJson: JSON.stringify({ storageOwner: "Google Drive" }),
        }),
      ],
    });

    expect(resolved).toMatchObject({
      spreadsheetId: "",
      driveRootFolderId: "",
      sourceOrigin: "missing",
    });
  });

  it("parses one source choice without requiring the other source", () => {
    expect(
      parseSinglePortfolioSourceConfig({
        kind: "master-spreadsheet",
        googleFileId: "sheet_12345678901234567890",
        name: "Master Spreadsheet",
        sheetName: "Rentals",
      }),
    ).toEqual({
      kind: "master-spreadsheet",
      googleFileId: "sheet_12345678901234567890",
      name: "Master Spreadsheet",
      sheetName: "Rentals",
    });
  });
});

function source(overrides: {
  kind: string;
  googleFileId: string;
  metadataJson: string;
}) {
  return {
    id: `${overrides.kind}-${overrides.googleFileId}`,
    kind: overrides.kind,
    googleFileId: overrides.googleFileId,
    googleFileUrl: "",
    metadataJson: overrides.metadataJson,
    status: "synced",
    updatedAt: new Date("2026-06-17T12:00:00.000Z"),
  };
}
