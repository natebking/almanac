import { describe, expect, it } from "vitest";
import { LocalGoogleWorkspaceAdapter } from "@/lib/google/local-adapter";
import {
  buildSourceCandidateQuery,
  sourceCandidateKindToMimeType,
} from "@/lib/google/source-picker";

describe("google source picker helpers", () => {
  it("maps source candidate kinds to Google Drive MIME types", () => {
    expect(sourceCandidateKindToMimeType("spreadsheet")).toBe(
      "application/vnd.google-apps.spreadsheet",
    );
    expect(sourceCandidateKindToMimeType("folder")).toBe(
      "application/vnd.google-apps.folder",
    );
  });

  it("builds a Drive query with trashed, MIME type, and escaped search text", () => {
    expect(
      buildSourceCandidateQuery({
        kind: "spreadsheet",
        search: "the operator's Rentals",
      }),
    ).toBe(
      "trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet' and name contains 'the operator\\'s Rentals'",
    );
  });

  it("filters local source candidates by kind and search text", async () => {
    const adapter = new LocalGoogleWorkspaceAdapter();

    const sheets = await adapter.listSourceCandidates({
      kind: "spreadsheet",
      search: "master",
    });
    const folders = await adapter.listSourceCandidates({
      kind: "folder",
      search: "example",
    });

    expect(sheets.files.map((file) => file.name)).toEqual([
      "Example Property Group Master Spreadsheet",
    ]);
    expect(folders.files.map((file) => file.name)).toEqual([
      "Example Property Group Drive Root",
    ]);
  });
});
