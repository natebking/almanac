export const CORE_GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

export const OPTIONAL_GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
] as const;

export const GOOGLE_SCOPES = [...CORE_GOOGLE_SCOPES] as const;

export function buildGoogleScopes(input?: {
  includeOptionalDiagnostics?: boolean;
}): string[] {
  return input?.includeOptionalDiagnostics
    ? [...CORE_GOOGLE_SCOPES, ...OPTIONAL_GOOGLE_SCOPES]
    : [...CORE_GOOGLE_SCOPES];
}
