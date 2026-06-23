import { google } from "googleapis";
import type {
  GoogleCalendarEventSummary,
  GoogleCalendarEventsInput,
  GoogleDriveFileMetadata,
  GoogleDriveListInput,
  GoogleDrivePdfInput,
  GoogleDriveTextInput,
  GoogleDocumentGenerationInput,
  GoogleDocumentGenerationResult,
  GoogleGmailHeadersInput,
  GoogleGmailMessageHeaderSummary,
  GoogleSpreadsheetValuesInput,
  GoogleSourceCandidate,
  GoogleSourceCandidateInput,
  GoogleWorkspaceAdapter,
} from "@/lib/google/types";
import type { GoogleOAuthClient } from "@/lib/google/oauth";
import { buildSourceCandidateQuery } from "@/lib/google/source-picker";
import {
  GOOGLE_DOC_MIME_TYPE,
  MARKDOWN_MIME_TYPE,
  PLAIN_TEXT_MIME_TYPE,
} from "@/lib/sync/drive-text";

const DOWNLOADABLE_TEXT_MIME_TYPES = new Set([
  PLAIN_TEXT_MIME_TYPE,
  MARKDOWN_MIME_TYPE,
]);

export class RealGoogleWorkspaceAdapter implements GoogleWorkspaceAdapter {
  constructor(private readonly auth: GoogleOAuthClient) {}

  async generateDocument(
    input: GoogleDocumentGenerationInput,
  ): Promise<GoogleDocumentGenerationResult> {
    const drive = google.drive({ auth: this.auth, version: "v3" });
    const docs = google.docs({ auth: this.auth, version: "v1" });

    const copy = await drive.files.copy({
      fileId: input.templateDocId,
      fields: "id, webViewLink",
      requestBody: {
        name: input.title,
        parents: input.folderId ? [input.folderId] : undefined,
      },
    });

    const googleDocId = copy.data.id;
    if (!googleDocId) {
      throw new Error("Google did not return a copied document ID.");
    }

    const requests = Object.entries(input.values).map(([key, value]) => ({
      replaceAllText: {
        containsText: {
          text: `{{${key}}}`,
          matchCase: false,
        },
        replaceText: value,
      },
    }));

    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId: googleDocId,
        requestBody: { requests },
      });
    }

    return {
      googleDocId,
      googleDocUrl:
        copy.data.webViewLink ??
        `https://docs.google.com/document/d/${googleDocId}/edit`,
    };
  }

  async readSpreadsheetValues(
    input: GoogleSpreadsheetValuesInput,
  ): Promise<string[][]> {
    const sheets = google.sheets({ auth: this.auth, version: "v4" });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: input.spreadsheetId,
      range: input.range,
    });

    return (response.data.values ?? []).map((row) =>
      row.map((cell) => String(cell ?? "")),
    );
  }

  async listDriveFiles(input: GoogleDriveListInput): Promise<{
    files: GoogleDriveFileMetadata[];
    nextPageToken: string | null;
  }> {
    const drive = google.drive({ auth: this.auth, version: "v3" });
    const response = await drive.files.list({
      q: `'${input.folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime)",
      pageSize: 100,
      pageToken: input.pageToken,
    });

    return {
      files: (response.data.files ?? []).map((file) => ({
        id: file.id ?? "",
        name: file.name ?? "",
        mimeType: file.mimeType ?? "",
        webViewLink: file.webViewLink ?? "",
        modifiedTime: file.modifiedTime ?? null,
      })),
      nextPageToken: response.data.nextPageToken ?? null,
    };
  }

  async listSourceCandidates(input: GoogleSourceCandidateInput): Promise<{
    files: GoogleSourceCandidate[];
    nextPageToken: string | null;
  }> {
    const drive = google.drive({ auth: this.auth, version: "v3" });
    const response = await drive.files.list({
      q: buildSourceCandidateQuery(input),
      fields:
        "nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime)",
      orderBy: "modifiedTime desc",
      pageSize: 10,
      pageToken: input.pageToken,
    });

    return {
      files: (response.data.files ?? []).map((file) => ({
        id: file.id ?? "",
        kind: input.kind,
        name: file.name ?? "",
        mimeType: file.mimeType ?? "",
        webViewLink: file.webViewLink ?? "",
        modifiedTime: file.modifiedTime ?? null,
      })),
      nextPageToken: response.data.nextPageToken ?? null,
    };
  }

  async exportDriveFileText(
    input: GoogleDriveTextInput,
  ): Promise<string | null> {
    const drive = google.drive({ auth: this.auth, version: "v3" });

    if (input.mimeType === GOOGLE_DOC_MIME_TYPE) {
      const response = await drive.files.export(
        {
          fileId: input.fileId,
          mimeType: "text/plain",
        },
        {
          responseType: "text",
        },
      );

      return typeof response.data === "string"
        ? response.data
        : String(response.data ?? "");
    }

    if (DOWNLOADABLE_TEXT_MIME_TYPES.has(input.mimeType)) {
      const response = await drive.files.get(
        {
          fileId: input.fileId,
          alt: "media",
        },
        {
          responseType: "text",
        },
      );

      return typeof response.data === "string"
        ? response.data
        : String(response.data ?? "");
    }

    return null;
  }

  async exportDriveFilePdf(input: GoogleDrivePdfInput): Promise<Uint8Array | null> {
    const drive = google.drive({ auth: this.auth, version: "v3" });
    const response = await drive.files.export(
      {
        fileId: input.fileId,
        mimeType: "application/pdf",
      },
      {
        responseType: "arraybuffer",
      },
    );

    return bytesFromGoogleResponse(response.data);
  }

  async listCalendarEvents(
    input: GoogleCalendarEventsInput,
  ): Promise<GoogleCalendarEventSummary[]> {
    const calendar = google.calendar({ auth: this.auth, version: "v3" });
    const response = await calendar.events.list({
      calendarId: "primary",
      fields: "items(id,summary,start,end,htmlLink)",
      maxResults: input.maxResults,
      orderBy: "startTime",
      singleEvents: true,
      timeMin: input.timeMin,
    });

    return (response.data.items ?? []).map((event) => ({
      id: event.id ?? "",
      title: event.summary ?? "Untitled event",
      start: event.start?.dateTime ?? event.start?.date ?? null,
      end: event.end?.dateTime ?? event.end?.date ?? null,
      htmlLink: event.htmlLink ?? null,
    }));
  }

  async listGmailMessageHeaders(
    input: GoogleGmailHeadersInput,
  ): Promise<GoogleGmailMessageHeaderSummary[]> {
    const gmail = google.gmail({ auth: this.auth, version: "v1" });
    const listResponse = await gmail.users.messages.list({
      fields: "messages(id,threadId)",
      maxResults: input.maxResults,
      userId: "me",
    });

    const messages = listResponse.data.messages ?? [];
    const messageResponses = await Promise.all(
      messages.map((message) =>
        gmail.users.messages.get({
          fields: "id,threadId,labelIds,payload/headers",
          format: "metadata",
          id: message.id ?? "",
          metadataHeaders: ["Subject", "From", "Date"],
          userId: "me",
        }),
      ),
    );

    return messageResponses.map((response) => {
      const headers = response.data.payload?.headers ?? [];

      return {
        id: response.data.id ?? "",
        threadId: response.data.threadId ?? "",
        subject: headerValue(headers, "Subject"),
        from: headerValue(headers, "From"),
        date: headerValue(headers, "Date"),
        labelIds: response.data.labelIds ?? [],
      };
    });
  }
}

function bytesFromGoogleResponse(data: unknown): Uint8Array | null {
  if (!data) {
    return null;
  }

  if (data instanceof Uint8Array) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  return new TextEncoder().encode(String(data));
}

function headerValue(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string,
): string {
  return headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())
    ?.value ?? "";
}
