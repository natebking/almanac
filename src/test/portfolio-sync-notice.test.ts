import { describe, expect, it } from "vitest";
import { buildPortfolioSyncNoticeText } from "@/lib/sync/portfolio-sync-notice";

describe("buildPortfolioSyncNoticeText", () => {
  it("includes property profile counts in the sync success notice", () => {
    expect(
      buildPortfolioSyncNoticeText({
        properties: "6",
        profiles: "4",
        files: "9",
        folders: "5",
        templates: "2",
        textExtracted: "3",
        textExtractFailed: "1",
        removed: "2",
      }),
    ).toBe(
      "Synced 6 properties, 4 property profiles, 9 Drive files, 5 property folders, 2 Google Docs templates, and 3 document text snippets (1 extraction failure). Removed 2 stale Drive files.",
    );
  });

  it("defaults missing counts to zero", () => {
    expect(buildPortfolioSyncNoticeText({})).toBe(
      "Synced 0 properties, 0 property profiles, 0 Drive files, 0 property folders, 0 Google Docs templates, and 0 document text snippets.",
    );
  });
});
