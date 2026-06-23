import type { PortfolioSyncResult } from "@/lib/sync/portfolio-sync";

export function applyPortfolioSyncSuccessParams(
  url: URL,
  result: PortfolioSyncResult,
): URL {
  url.searchParams.set("sync", "ok");
  url.searchParams.set("properties", String(result.propertiesSynced));
  url.searchParams.set("profiles", String(result.propertyProfilesSynced));
  url.searchParams.set("files", String(result.driveFilesSynced));
  url.searchParams.set("folders", String(result.propertyFoldersLinked));
  url.searchParams.set("templates", String(result.templatesSynced));
  url.searchParams.set("textExtracted", String(result.textExtracted));
  url.searchParams.set("textExtractFailed", String(result.textExtractFailed));
  url.searchParams.set("removed", String(result.driveFilesRemoved));

  return url;
}
