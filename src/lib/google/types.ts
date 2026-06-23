export type GoogleDocumentGenerationInput = {
  templateDocId: string;
  title: string;
  folderId?: string | null;
  values: Record<string, string>;
};

export type GoogleDocumentGenerationResult = {
  googleDocId: string | null;
  googleDocUrl: string | null;
};

export type GoogleSpreadsheetValuesInput = {
  spreadsheetId: string;
  range: string;
};

export type GoogleDriveListInput = {
  folderId: string;
  pageToken?: string;
};

export type GoogleDriveTextInput = {
  fileId: string;
  mimeType: string;
};

export type GoogleDrivePdfInput = {
  fileId: string;
};

export type GoogleCalendarEventsInput = {
  maxResults: number;
  timeMin: string;
};

export type GoogleCalendarEventSummary = {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  htmlLink: string | null;
};

export type GoogleGmailHeadersInput = {
  maxResults: number;
};

export type GoogleGmailMessageHeaderSummary = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  labelIds: string[];
};

export type GoogleWorkspaceDiagnostics = {
  calendarEvents: GoogleCalendarEventSummary[];
  calendarError: string | null;
  gmailMessages: GoogleGmailMessageHeaderSummary[];
  gmailError: string | null;
};

export type GoogleDriveFileMetadata = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  modifiedTime: string | null;
};

export type GoogleSourceCandidateKind = "spreadsheet" | "folder";

export type GoogleSourceCandidate = GoogleDriveFileMetadata & {
  kind: GoogleSourceCandidateKind;
};

export type GoogleSourceCandidateInput = {
  kind: GoogleSourceCandidateKind;
  search?: string;
  pageToken?: string;
};

export type GoogleWorkspaceAdapter = {
  generateDocument(
    input: GoogleDocumentGenerationInput,
  ): Promise<GoogleDocumentGenerationResult>;
  readSpreadsheetValues(input: GoogleSpreadsheetValuesInput): Promise<string[][]>;
  listDriveFiles(input: GoogleDriveListInput): Promise<{
    files: GoogleDriveFileMetadata[];
    nextPageToken: string | null;
  }>;
  listSourceCandidates(input: GoogleSourceCandidateInput): Promise<{
    files: GoogleSourceCandidate[];
    nextPageToken: string | null;
  }>;
  exportDriveFileText(input: GoogleDriveTextInput): Promise<string | null>;
  exportDriveFilePdf(input: GoogleDrivePdfInput): Promise<Uint8Array | null>;
  listCalendarEvents(
    input: GoogleCalendarEventsInput,
  ): Promise<GoogleCalendarEventSummary[]>;
  listGmailMessageHeaders(
    input: GoogleGmailHeadersInput,
  ): Promise<GoogleGmailMessageHeaderSummary[]>;
};
