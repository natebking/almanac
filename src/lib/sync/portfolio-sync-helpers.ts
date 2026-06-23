import type { GoogleDriveFileMetadata } from "@/lib/google/types";
import { extractPlaceholders } from "@/lib/placeholders";
import {
  normalizeSearchText,
  parseMasterSpreadsheetRows,
  type ParsedPropertyIndexRow,
  type ParsedPropertyProfile,
} from "@/lib/spreadsheet/property-rows";

export type SyncPropertyMatch = {
  id: string;
  address: string;
  normalizedAddress: string;
};

export type PlannedDriveFileRow = {
  userId: string;
  sourceConnectionId: string;
  propertyIndexId: string | null;
  googleFileId: string;
  name: string;
  mimeType: string;
  category: string;
  webViewLink: string;
  modifiedTime: Date | null;
  textExtract: string;
};

export type PlannedPropertyProfileRow = ParsedPropertyProfile & {
  userId: string;
  propertyIndexId: string;
};

export type PlannedDocumentTemplateRow = {
  userId: string;
  name: string;
  description: string;
  googleDocId: string;
  googleDocUrl: string;
  localBody: string;
  placeholders: string;
};

export type PlanSpreadsheetRowsInput = {
  spreadsheetId: string;
  sheetName: string;
  values: string[][];
};

export type PlanDriveFileRowsInput = {
  userId: string;
  sourceConnectionId: string;
  properties: SyncPropertyMatch[];
  rootFiles: GoogleDriveFileMetadata[];
  filesByFolderId: Record<string, GoogleDriveFileMetadata[]>;
};

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";

export function isDriveFolder(file: GoogleDriveFileMetadata): boolean {
  return file.mimeType === FOLDER_MIME_TYPE;
}

export function categorizeDriveFile(file: GoogleDriveFileMetadata): string {
  const name = normalizeSearchText(file.name);

  if (
    includesAny(name, [
      "template",
      "checklist",
      "welcome letter",
      "door drop",
      "utility transfer",
    ])
  ) {
    return "template";
  }

  if (name.includes("lease")) {
    return "lease";
  }

  if (name.includes("application")) {
    return "application";
  }

  if (includesAny(name, ["photo", "photos", "image"])) {
    return "photos";
  }

  if (includesAny(name, ["maintenance", "repair", "hvac", "warranty"])) {
    return "maintenance";
  }

  if (
    includesAny(name, [
      "financial",
      "owner statement",
      "check",
      "expense",
      "invoice",
      "commission",
    ])
  ) {
    return "financial";
  }

  if (includesAny(name, ["project", "remodel", "scope"])) {
    return "project";
  }

  if (
    includesAny(name, [
      "tenant overview",
      "tenant contacts",
      "birthdays",
      "review timeline",
      "restaurant recommendations",
    ])
  ) {
    return "material";
  }

  return isDriveFolder(file) ? "folder" : "document";
}

export function findPropertyForDriveName(
  name: string,
  properties: SyncPropertyMatch[],
): SyncPropertyMatch | null {
  const normalizedName = normalizeSearchText(name);

  return (
    properties.find((property) => {
      const normalizedAddress =
        property.normalizedAddress || normalizeSearchText(property.address);

      return (
        normalizedAddress !== "" &&
        (normalizedName.includes(normalizedAddress) ||
          normalizedAddress.includes(normalizedName))
      );
    }) ?? null
  );
}

export function planSpreadsheetRows(
  input: PlanSpreadsheetRowsInput,
): ParsedPropertyIndexRow[] {
  const [headers, ...rows] = input.values;
  if (!headers) {
    throw new Error("The master spreadsheet returned no header row.");
  }

  return parseMasterSpreadsheetRows({
    spreadsheetId: input.spreadsheetId,
    sheetName: input.sheetName,
    headers,
    rows,
  });
}

export function planPropertyProfileRow(input: {
  row: ParsedPropertyIndexRow;
  userId: string;
  propertyIndexId: string;
}): PlannedPropertyProfileRow | null {
  if (!input.row.profile) {
    return null;
  }

  return {
    userId: input.userId,
    propertyIndexId: input.propertyIndexId,
    ...input.row.profile,
  };
}

export function planDriveFileRows(
  input: PlanDriveFileRowsInput,
): PlannedDriveFileRow[] {
  const plannedRows: PlannedDriveFileRow[] = [];

  for (const rootFile of input.rootFiles) {
    if (isDriveFolder(rootFile)) {
      const folderProperty = findPropertyForDriveName(rootFile.name, input.properties);
      if (!folderProperty) {
        plannedRows.push(toDriveRow(input, rootFile, null));
        for (const childFile of input.filesByFolderId[rootFile.id] ?? []) {
          plannedRows.push(toDriveRow(input, childFile, null));
        }
        continue;
      }

      for (const childFile of input.filesByFolderId[rootFile.id] ?? []) {
        plannedRows.push(toDriveRow(input, childFile, folderProperty.id));
      }
      continue;
    }

    plannedRows.push(
      toDriveRow(
        input,
        rootFile,
        findPropertyForDriveName(rootFile.name, input.properties)?.id ?? null,
      ),
    );
  }

  return plannedRows;
}

export function planDocumentTemplateRows(input: {
  userId: string;
  driveRows: PlannedDriveFileRow[];
}): PlannedDocumentTemplateRow[] {
  const templatesByGoogleDocId = new Map<string, PlannedDocumentTemplateRow>();

  for (const row of input.driveRows) {
    const localBody = row.textExtract.trim();
    if (
      row.category !== "template" ||
      row.mimeType !== GOOGLE_DOC_MIME_TYPE ||
      !localBody
    ) {
      continue;
    }

    templatesByGoogleDocId.set(row.googleFileId, {
      userId: input.userId,
      name: cleanTemplateName(row.name),
      description: "Synced from Google Drive template.",
      googleDocId: row.googleFileId,
      googleDocUrl: row.webViewLink,
      localBody,
      placeholders: JSON.stringify(extractPlaceholders(localBody)),
    });
  }

  return Array.from(templatesByGoogleDocId.values());
}

export function findStaleDriveFileIds(input: {
  existingGoogleFileIds: string[];
  plannedRows: PlannedDriveFileRow[];
}): string[] {
  const plannedIds = new Set(input.plannedRows.map((row) => row.googleFileId));
  const staleIds = input.existingGoogleFileIds.filter((googleFileId) => {
    return googleFileId && !plannedIds.has(googleFileId);
  });

  return Array.from(new Set(staleIds));
}

function toDriveRow(
  input: Pick<PlanDriveFileRowsInput, "sourceConnectionId" | "userId">,
  file: GoogleDriveFileMetadata,
  propertyIndexId: string | null,
): PlannedDriveFileRow {
  return {
    userId: input.userId,
    sourceConnectionId: input.sourceConnectionId,
    propertyIndexId,
    googleFileId: file.id,
    name: file.name,
    mimeType: file.mimeType,
    category: categorizeDriveFile(file),
    webViewLink: file.webViewLink,
    modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
    textExtract: "",
  };
}

function cleanTemplateName(name: string): string {
  return name.replace(/\s+template$/i, "").trim();
}

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}
