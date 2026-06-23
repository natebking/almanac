const GOOGLE_ID_RE = /^[a-zA-Z0-9_-]{20,}$/;

export function extractGoogleDocId(input: string): string {
  const value = input.trim();
  if (GOOGLE_ID_RE.test(value)) {
    return value;
  }

  return value.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? "";
}

export function extractGoogleSpreadsheetId(input: string): string {
  const value = input.trim();
  if (GOOGLE_ID_RE.test(value)) {
    return value;
  }

  return (
    value.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
    value.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ??
    ""
  );
}

export function extractDriveFolderId(input: string): string {
  const value = input.trim();
  if (GOOGLE_ID_RE.test(value)) {
    return value;
  }

  return (
    value.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ??
    value.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ??
    ""
  );
}
