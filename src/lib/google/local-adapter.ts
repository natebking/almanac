import type {
  GoogleCalendarEventSummary,
  GoogleCalendarEventsInput,
  GoogleDocumentGenerationInput,
  GoogleDocumentGenerationResult,
  GoogleDrivePdfInput,
  GoogleDriveTextInput,
  GoogleGmailHeadersInput,
  GoogleGmailMessageHeaderSummary,
  GoogleSourceCandidate,
  GoogleSourceCandidateInput,
  GoogleWorkspaceAdapter,
} from "@/lib/google/types";
import { filterSourceCandidates } from "@/lib/google/source-picker";

const LOCAL_SOURCE_CANDIDATES: GoogleSourceCandidate[] = [
  {
    id: "sample-master-spreadsheet",
    kind: "spreadsheet",
    name: "Example Property Group Master Spreadsheet",
    mimeType: "application/vnd.google-apps.spreadsheet",
    webViewLink: "https://docs.google.com/spreadsheets/d/sample-master-spreadsheet",
    modifiedTime: "2026-06-17T12:00:00.000Z",
  },
  {
    id: "sample-drive-root",
    kind: "folder",
    name: "Example Property Group Drive Root",
    mimeType: "application/vnd.google-apps.folder",
    webViewLink: "https://drive.google.com/drive/folders/sample-drive-root",
    modifiedTime: "2026-06-17T12:10:00.000Z",
  },
  {
    id: "sample-archive-folder",
    kind: "folder",
    name: "Archive Folder",
    mimeType: "application/vnd.google-apps.folder",
    webViewLink: "https://drive.google.com/drive/folders/sample-archive-folder",
    modifiedTime: "2026-05-01T12:00:00.000Z",
  },
];

export class LocalGoogleWorkspaceAdapter implements GoogleWorkspaceAdapter {
  async generateDocument(
    input: GoogleDocumentGenerationInput,
  ): Promise<GoogleDocumentGenerationResult> {
    const localId = `local-${input.templateDocId}-${Date.now()}`;

    return {
      googleDocId: localId,
      googleDocUrl: `/local-doc/${encodeURIComponent(localId)}`,
    };
  }

  async readSpreadsheetValues(): Promise<string[][]> {
    return [];
  }

  async listDriveFiles(): Promise<{
    files: [];
    nextPageToken: null;
  }> {
    return { files: [], nextPageToken: null };
  }

  async listSourceCandidates(input: GoogleSourceCandidateInput): Promise<{
    files: GoogleSourceCandidate[];
    nextPageToken: null;
  }> {
    return {
      files: filterSourceCandidates(LOCAL_SOURCE_CANDIDATES, input),
      nextPageToken: null,
    };
  }

  async exportDriveFileText(input: GoogleDriveTextInput): Promise<string> {
    void input;
    return "";
  }

  async exportDriveFilePdf(input: GoogleDrivePdfInput): Promise<null> {
    void input;
    return null;
  }

  async listCalendarEvents(
    input: GoogleCalendarEventsInput,
  ): Promise<GoogleCalendarEventSummary[]> {
    void input;
    return [
      {
        id: "local-event-1",
        title: "Sample move-in walkthrough",
        start: "2026-06-18T16:00:00.000Z",
        end: "2026-06-18T16:30:00.000Z",
        htmlLink: null,
      },
    ];
  }

  async listGmailMessageHeaders(
    input: GoogleGmailHeadersInput,
  ): Promise<GoogleGmailMessageHeaderSummary[]> {
    void input;
    return [
      {
        id: "local-message-1",
        threadId: "local-thread-1",
        subject: "Sample tenant question",
        from: "tenant@example.com",
        date: "Wed, 17 Jun 2026 10:00:00 -0700",
        labelIds: ["INBOX"],
      },
    ];
  }
}
