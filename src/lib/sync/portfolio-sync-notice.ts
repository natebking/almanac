export type PortfolioSyncNoticeParams = {
  properties?: string;
  profiles?: string;
  files?: string;
  folders?: string;
  templates?: string;
  textExtracted?: string;
  textExtractFailed?: string;
  removed?: string;
};

export function buildPortfolioSyncNoticeText(
  params: PortfolioSyncNoticeParams,
): string {
  const textExtractFailed = countText(params.textExtractFailed);
  const failureText =
    textExtractFailed !== "0"
      ? ` (${textExtractFailed} extraction ${textExtractFailed === "1" ? "failure" : "failures"}).`
      : ".";
  const removed = countText(params.removed);
  const removedText =
    removed !== "0"
      ? ` Removed ${removed} stale Drive ${removed === "1" ? "file" : "files"}.`
      : "";

  return [
    `Synced ${countText(params.properties)} properties,`,
    `${countText(params.profiles)} property profiles,`,
    `${countText(params.files)} Drive files,`,
    `${countText(params.folders)} property folders,`,
    `${countText(params.templates)} Google Docs templates, and`,
    `${countText(params.textExtracted)} document text snippets${failureText}`,
  ].join(" ") + removedText;
}

function countText(value: string | undefined): string {
  return value?.trim() || "0";
}
