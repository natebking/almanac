import type {
  GoogleSourceCandidate,
  GoogleSourceCandidateKind,
} from "@/lib/google/types";
import { normalizeSearchText } from "@/lib/spreadsheet/property-rows";

export const GOOGLE_SPREADSHEET_MIME_TYPE =
  "application/vnd.google-apps.spreadsheet";
export const GOOGLE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export function sourceCandidateKindToMimeType(
  kind: GoogleSourceCandidateKind,
): string {
  return kind === "spreadsheet"
    ? GOOGLE_SPREADSHEET_MIME_TYPE
    : GOOGLE_FOLDER_MIME_TYPE;
}

export function buildSourceCandidateQuery(input: {
  kind: GoogleSourceCandidateKind;
  search?: string;
}): string {
  const parts = [
    "trashed = false",
    `mimeType = '${sourceCandidateKindToMimeType(input.kind)}'`,
  ];
  const search = input.search?.trim();

  if (search) {
    parts.push(`name contains '${escapeDriveQueryValue(search)}'`);
  }

  return parts.join(" and ");
}

export function filterSourceCandidates(
  candidates: GoogleSourceCandidate[],
  input: {
    kind: GoogleSourceCandidateKind;
    search?: string;
  },
): GoogleSourceCandidate[] {
  const search = normalizeSearchText(input.search ?? "");

  return candidates
    .filter((candidate) => candidate.kind === input.kind)
    .filter((candidate) => {
      if (!search) {
        return true;
      }

      return normalizeSearchText(candidate.name).includes(search);
    });
}

function escapeDriveQueryValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
