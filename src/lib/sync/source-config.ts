import { getDb } from "@/lib/db";
import type { AppEnv } from "@/lib/env";
import { extractDriveFolderId, extractGoogleSpreadsheetId } from "@/lib/google/ids";

export type SourceConfigInput = {
  spreadsheetInput: string;
  sheetName: string;
  driveRootInput: string;
};

export type SingleSourceConfigInput = {
  kind: "master-spreadsheet" | "drive-root";
  googleFileId: string;
  name: string;
  sheetName?: string;
};

export type ParsedPortfolioSourceConfig = {
  spreadsheetId: string;
  sheetName: string;
  driveRootFolderId: string;
};

export type SourceConfigSource = {
  id: string;
  kind: string;
  googleFileId: string | null;
  googleFileUrl: string | null;
  metadataJson: string;
  status: string;
  lastSyncedAt?: Date | null;
  updatedAt: Date;
};

export type ResolvedPortfolioSourceConfig = ParsedPortfolioSourceConfig & {
  sourceOrigin: "settings" | "environment" | "missing";
  spreadsheetSource: SourceConfigSource | null;
  driveSource: SourceConfigSource | null;
};

export class SourceConfigError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "SourceConfigError";
  }
}

export function parsePortfolioSourceConfig(
  input: SourceConfigInput,
): ParsedPortfolioSourceConfig {
  const spreadsheetId = extractGoogleSpreadsheetId(input.spreadsheetInput);
  const driveRootFolderId = extractDriveFolderId(input.driveRootInput);
  const sheetName = input.sheetName.trim();

  if (!spreadsheetId) {
    throw new SourceConfigError(
      "Master spreadsheet URL or ID is required.",
      "spreadsheet",
    );
  }

  if (!sheetName) {
    throw new SourceConfigError("Sheet tab name is required.", "sheet");
  }

  if (!driveRootFolderId) {
    throw new SourceConfigError(
      "Drive root folder URL or ID is required.",
      "drive-root",
    );
  }

  return {
    spreadsheetId,
    sheetName,
    driveRootFolderId,
  };
}

export function parseSinglePortfolioSourceConfig(
  input: SingleSourceConfigInput,
): SingleSourceConfigInput {
  const googleFileId = input.googleFileId.trim();
  const name = input.name.trim();
  const sheetName = input.sheetName?.trim() || "Rentals";

  if (input.kind !== "master-spreadsheet" && input.kind !== "drive-root") {
    throw new SourceConfigError("Unsupported source kind.", "kind");
  }

  if (!googleFileId) {
    throw new SourceConfigError("Google file ID is required.", "google-file");
  }

  if (!name) {
    throw new SourceConfigError("Google file name is required.", "google-file");
  }

  return {
    kind: input.kind,
    googleFileId,
    name,
    sheetName,
  };
}

export function resolvePortfolioSourceConfig(input: {
  env: Pick<
    AppEnv,
    | "GOOGLE_MASTER_SPREADSHEET_ID"
    | "GOOGLE_MASTER_SHEET_NAME"
    | "GOOGLE_TEST_ROOT_FOLDER_ID"
  >;
  sources: SourceConfigSource[];
}): ResolvedPortfolioSourceConfig {
  const spreadsheetSource = newestSettingsSource(
    input.sources,
    "master-spreadsheet",
  );
  const driveSource = newestSettingsSource(input.sources, "drive-root");
  const sourceOrigin =
    spreadsheetSource || driveSource
      ? "settings"
      : input.env.GOOGLE_MASTER_SPREADSHEET_ID ||
          input.env.GOOGLE_TEST_ROOT_FOLDER_ID
        ? "environment"
        : "missing";

  return {
    spreadsheetId:
      spreadsheetSource?.googleFileId ?? input.env.GOOGLE_MASTER_SPREADSHEET_ID,
    sheetName:
      sourceMetadata(spreadsheetSource).sheetName ??
      input.env.GOOGLE_MASTER_SHEET_NAME,
    driveRootFolderId:
      driveSource?.googleFileId ?? input.env.GOOGLE_TEST_ROOT_FOLDER_ID,
    sourceOrigin,
    spreadsheetSource,
    driveSource,
  };
}

export async function savePortfolioSourceConfig(input: {
  userId: string;
  spreadsheetInput: string;
  sheetName: string;
  driveRootInput: string;
}) {
  const parsed = parsePortfolioSourceConfig(input);
  const db = await getDb();
  const [spreadsheetSource, driveSource] = await Promise.all([
    upsertConfiguredSource({
      userId: input.userId,
      kind: "master-spreadsheet",
      name: "Example Property Group Master Spreadsheet",
      googleFileId: parsed.spreadsheetId,
      googleFileUrl: `https://docs.google.com/spreadsheets/d/${parsed.spreadsheetId}`,
      metadata: {
        configuredBy: "settings",
        sheetName: parsed.sheetName,
        sourceOfTruth: true,
      },
    }),
    upsertConfiguredSource({
      userId: input.userId,
      kind: "drive-root",
      name: "Example Property Group Drive Root",
      googleFileId: parsed.driveRootFolderId,
      googleFileUrl: `https://drive.google.com/drive/folders/${parsed.driveRootFolderId}`,
      metadata: {
        configuredBy: "settings",
        storageOwner: "Google Drive",
      },
    }),
  ]);

  await db.sourceConnection.updateMany({
    where: {
      userId: input.userId,
      kind: "master-spreadsheet",
      id: { not: spreadsheetSource.id },
      metadataJson: { contains: '"configuredBy":"settings"' },
    },
    data: { status: "replaced" },
  });
  await db.sourceConnection.updateMany({
    where: {
      userId: input.userId,
      kind: "drive-root",
      id: { not: driveSource.id },
      metadataJson: { contains: '"configuredBy":"settings"' },
    },
    data: { status: "replaced" },
  });

  return { parsed, spreadsheetSource, driveSource };
}

export async function saveSinglePortfolioSourceConfig(input: {
  userId: string;
  kind: "master-spreadsheet" | "drive-root";
  googleFileId: string;
  name: string;
  sheetName?: string;
}) {
  const parsed = parseSinglePortfolioSourceConfig(input);
  let source: Awaited<ReturnType<typeof upsertConfiguredSource>>;

  if (parsed.kind === "master-spreadsheet") {
    source = await upsertConfiguredSource({
      userId: input.userId,
      kind: "master-spreadsheet",
      name: parsed.name,
      googleFileId: parsed.googleFileId,
      googleFileUrl: `https://docs.google.com/spreadsheets/d/${parsed.googleFileId}`,
      metadata: {
        configuredBy: "settings",
        sheetName: parsed.sheetName,
        sourceOfTruth: true,
      },
    });
  } else {
    source = await upsertConfiguredSource({
      userId: input.userId,
      kind: "drive-root",
      name: parsed.name,
      googleFileId: parsed.googleFileId,
      googleFileUrl: `https://drive.google.com/drive/folders/${parsed.googleFileId}`,
      metadata: {
        configuredBy: "settings",
        storageOwner: "Google Drive",
      },
    });
  }

  const db = await getDb();
  await db.sourceConnection.updateMany({
    where: {
      userId: input.userId,
      kind: parsed.kind,
      id: { not: source.id },
      metadataJson: { contains: '"configuredBy":"settings"' },
    },
    data: { status: "replaced" },
  });

  return source;
}

async function upsertConfiguredSource(input: {
  userId: string;
  kind: string;
  name: string;
  googleFileId: string;
  googleFileUrl: string;
  metadata: Record<string, unknown>;
}) {
  const db = await getDb();
  const existing = await db.sourceConnection.findFirst({
    where: {
      userId: input.userId,
      kind: input.kind,
      googleFileId: input.googleFileId,
    },
  });

  if (existing) {
    return db.sourceConnection.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        googleFileUrl: input.googleFileUrl,
        status: "configured",
        metadataJson: JSON.stringify(input.metadata),
      },
    });
  }

  return db.sourceConnection.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      name: input.name,
      googleFileId: input.googleFileId,
      googleFileUrl: input.googleFileUrl,
      status: "configured",
      metadataJson: JSON.stringify(input.metadata),
    },
  });
}

function newestSettingsSource(
  sources: SourceConfigSource[],
  kind: string,
): SourceConfigSource | null {
  return (
    sources
      .filter((source) => {
        const metadata = sourceMetadata(source);
        return (
          source.kind === kind &&
          source.status !== "replaced" &&
          metadata.configuredBy === "settings"
        );
      })
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0] ??
    null
  );
}

function sourceMetadata(source: SourceConfigSource | null): {
  configuredBy?: string;
  sheetName?: string;
} {
  if (!source) {
    return {};
  }

  try {
    const metadata = JSON.parse(source.metadataJson) as {
      configuredBy?: unknown;
      sheetName?: unknown;
    };

    return {
      configuredBy:
        typeof metadata.configuredBy === "string" ? metadata.configuredBy : undefined,
      sheetName: typeof metadata.sheetName === "string" ? metadata.sheetName : undefined,
    };
  } catch {
    return {};
  }
}
