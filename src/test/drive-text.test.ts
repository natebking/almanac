import { describe, expect, it, vi } from "vitest";
import {
  GOOGLE_DOC_MIME_TYPE,
  PLAIN_TEXT_MIME_TYPE,
  MARKDOWN_MIME_TYPE,
  extractDriveFileText,
  extractTextForDriveRows,
  normalizeExtractedText,
  supportsDriveTextExtraction,
} from "@/lib/sync/drive-text";
import type { GoogleWorkspaceAdapter } from "@/lib/google/types";

type DriveTextCapableAdapter = GoogleWorkspaceAdapter & {
  exportDriveFileText(input: {
    fileId: string;
    mimeType: string;
  }): Promise<string | null>;
};

const baseAdapter: DriveTextCapableAdapter = {
  async generateDocument() {
    return { googleDocId: null, googleDocUrl: null };
  },
  async readSpreadsheetValues() {
    return [];
  },
  async listDriveFiles() {
    return { files: [], nextPageToken: null };
  },
  async listSourceCandidates() {
    return { files: [], nextPageToken: null };
  },
  async exportDriveFileText() {
    return null;
  },
  async exportDriveFilePdf() {
    return null;
  },
  async listCalendarEvents() {
    return [];
  },
  async listGmailMessageHeaders() {
    return [];
  },
};

describe("drive text extraction helpers", () => {
  it("supports Google Docs, plain text, and Markdown files", () => {
    expect(supportsDriveTextExtraction(GOOGLE_DOC_MIME_TYPE)).toBe(true);
    expect(supportsDriveTextExtraction(PLAIN_TEXT_MIME_TYPE)).toBe(true);
    expect(supportsDriveTextExtraction(MARKDOWN_MIME_TYPE)).toBe(true);
    expect(supportsDriveTextExtraction("application/pdf")).toBe(false);
  });

  it("normalizes whitespace and caps snippets", () => {
    const text = normalizeExtractedText("  HVAC\n\n warranty   expires soon  ", 18);

    expect(text).toBe("HVAC warranty e...");
  });

  it("exports and normalizes supported Drive files", async () => {
    const exportDriveFileText = vi.fn().mockResolvedValue("  Dishwasher\n warranty  ");
    const adapter = { ...baseAdapter, exportDriveFileText };

    const text = await extractDriveFileText(adapter, {
      id: "doc_1",
      name: "Loch Lomand Dishwasher Repair",
      mimeType: GOOGLE_DOC_MIME_TYPE,
      webViewLink: "https://docs.google.com/document/d/doc_1",
      modifiedTime: null,
    });

    expect(exportDriveFileText).toHaveBeenCalledWith({
      fileId: "doc_1",
      mimeType: GOOGLE_DOC_MIME_TYPE,
    });
    expect(text).toBe("Dishwasher warranty");
  });

  it("skips unsupported files without calling Google export", async () => {
    const exportDriveFileText = vi.fn();
    const adapter = { ...baseAdapter, exportDriveFileText };

    const text = await extractDriveFileText(adapter, {
      id: "pdf_1",
      name: "Invoice.pdf",
      mimeType: "application/pdf",
      webViewLink: "https://drive.google.com/file/d/pdf_1",
      modifiedTime: null,
    });

    expect(text).toBe("");
    expect(exportDriveFileText).not.toHaveBeenCalled();
  });

  it("applies text extracts to planned Drive rows without failing the whole batch", async () => {
    const exportDriveFileText = vi
      .fn()
      .mockResolvedValueOnce("HVAC warranty expires 2027-05-10")
      .mockRejectedValueOnce(new Error("cannot export"));
    const adapter = { ...baseAdapter, exportDriveFileText };
    const rows = [
      {
        userId: "user_1",
        sourceConnectionId: "source_1",
        propertyIndexId: "property_loch",
        googleFileId: "doc_1",
        name: "Loch Lomand Warranty",
        mimeType: GOOGLE_DOC_MIME_TYPE,
        category: "maintenance",
        webViewLink: "https://docs.google.com/document/d/doc_1",
        modifiedTime: null,
        textExtract: "",
      },
      {
        userId: "user_1",
        sourceConnectionId: "source_1",
        propertyIndexId: "property_loch",
        googleFileId: "doc_2",
        name: "Loch Lomand Notes",
        mimeType: GOOGLE_DOC_MIME_TYPE,
        category: "maintenance",
        webViewLink: "https://docs.google.com/document/d/doc_2",
        modifiedTime: null,
        textExtract: "",
      },
    ];
    const files = rows.map((row) => ({
      id: row.googleFileId,
      name: row.name,
      mimeType: row.mimeType,
      webViewLink: row.webViewLink,
      modifiedTime: null,
    }));

    const result = await extractTextForDriveRows(adapter, rows, files);

    expect(result.rows[0].textExtract).toBe("HVAC warranty expires 2027-05-10");
    expect(result.rows[1].textExtract).toBe("");
    expect(result.textExtracted).toBe(1);
    expect(result.textExtractFailed).toBe(1);
  });
});
