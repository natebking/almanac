import { describe, expect, it } from "vitest";
import {
  extractDriveFolderId,
  extractGoogleDocId,
  extractGoogleSpreadsheetId,
} from "@/lib/google/ids";

describe("google ids", () => {
  it("extracts a Google Doc ID from a document URL", () => {
    expect(
      extractGoogleDocId(
        "https://docs.google.com/document/d/abcDEF_12345678901234567890/edit",
      ),
    ).toBe("abcDEF_12345678901234567890");
  });

  it("extracts a Drive folder ID from a folder URL", () => {
    expect(
      extractDriveFolderId(
        "https://drive.google.com/drive/folders/folder_12345678901234567890",
      ),
    ).toBe("folder_12345678901234567890");
  });

  it("extracts a Google spreadsheet ID from a Sheets URL", () => {
    expect(
      extractGoogleSpreadsheetId(
        "https://docs.google.com/spreadsheets/d/sheet_12345678901234567890/edit#gid=0",
      ),
    ).toBe("sheet_12345678901234567890");
  });
});
