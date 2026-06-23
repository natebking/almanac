import { describe, expect, it } from "vitest";
import { applyPortfolioSyncSuccessParams } from "@/lib/sync/portfolio-sync-redirect";

describe("applyPortfolioSyncSuccessParams", () => {
  it("adds document text extraction counts to the sync redirect", () => {
    const url = new URL("http://localhost:3000/settings/google");

    applyPortfolioSyncSuccessParams(url, {
      propertiesSynced: 6,
      driveFilesSynced: 9,
      propertyFoldersLinked: 5,
      propertyProfilesSynced: 4,
      templatesSynced: 2,
      rootDriveFilesSeen: 12,
      textExtracted: 3,
      textExtractFailed: 1,
      driveFilesRemoved: 2,
    });

    expect(url.searchParams.get("sync")).toBe("ok");
    expect(url.searchParams.get("properties")).toBe("6");
    expect(url.searchParams.get("profiles")).toBe("4");
    expect(url.searchParams.get("files")).toBe("9");
    expect(url.searchParams.get("folders")).toBe("5");
    expect(url.searchParams.get("templates")).toBe("2");
    expect(url.searchParams.get("textExtracted")).toBe("3");
    expect(url.searchParams.get("textExtractFailed")).toBe("1");
    expect(url.searchParams.get("removed")).toBe("2");
  });
});
