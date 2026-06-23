import type {
  GoogleDriveFileMetadata,
  GoogleWorkspaceAdapter,
} from "@/lib/google/types";

export const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";
export const PLAIN_TEXT_MIME_TYPE = "text/plain";
export const MARKDOWN_MIME_TYPE = "text/markdown";

const DOWNLOADABLE_TEXT_MIME_TYPES = new Set([
  PLAIN_TEXT_MIME_TYPE,
  MARKDOWN_MIME_TYPE,
]);

const DEFAULT_MAX_EXTRACT_LENGTH = 1_200;

export function supportsDriveTextExtraction(mimeType: string): boolean {
  return mimeType === GOOGLE_DOC_MIME_TYPE || DOWNLOADABLE_TEXT_MIME_TYPES.has(mimeType);
}

export function normalizeExtractedText(
  text: string | null | undefined,
  maxLength = DEFAULT_MAX_EXTRACT_LENGTH,
): string {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export async function extractDriveFileText(
  adapter: GoogleWorkspaceAdapter,
  file: GoogleDriveFileMetadata,
): Promise<string> {
  if (!supportsDriveTextExtraction(file.mimeType)) {
    return "";
  }

  const text = await adapter.exportDriveFileText({
    fileId: file.id,
    mimeType: file.mimeType,
  });

  return normalizeExtractedText(text);
}

export type DriveRowWithTextExtract = {
  googleFileId: string;
  textExtract: string;
};

export type DriveTextExtractionBatch<T extends DriveRowWithTextExtract> = {
  rows: T[];
  textExtracted: number;
  textExtractFailed: number;
};

export async function extractTextForDriveRows<T extends DriveRowWithTextExtract>(
  adapter: GoogleWorkspaceAdapter,
  rows: T[],
  files: GoogleDriveFileMetadata[],
): Promise<DriveTextExtractionBatch<T>> {
  const filesById = new Map(files.map((file) => [file.id, file]));
  let textExtracted = 0;
  let textExtractFailed = 0;
  const rowsWithText: T[] = [];

  for (const row of rows) {
    const file = filesById.get(row.googleFileId);
    let textExtract = row.textExtract;

    if (file) {
      try {
        textExtract = await extractDriveFileText(adapter, file);
        if (textExtract) {
          textExtracted += 1;
        }
      } catch {
        textExtractFailed += 1;
        textExtract = "";
      }
    }

    rowsWithText.push({ ...row, textExtract } as T);
  }

  return {
    rows: rowsWithText,
    textExtracted,
    textExtractFailed,
  };
}
