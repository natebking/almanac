import { getDb } from "@/lib/db";
import type {
  GoogleDriveFileMetadata,
  GoogleWorkspaceAdapter,
} from "@/lib/google/types";
import {
  findPropertyForDriveName,
  findStaleDriveFileIds,
  isDriveFolder,
  planDriveFileRows,
  planDocumentTemplateRows,
  planPropertyProfileRow,
  planSpreadsheetRows,
  type SyncPropertyMatch,
} from "@/lib/sync/portfolio-sync-helpers";
import { extractTextForDriveRows } from "@/lib/sync/drive-text";

const hostedFixtureMarker = "almanac-hosted-dummy";
const hostedSeedTemplateGoogleDocIds = [
  "template-move-in-checklist",
  "template-utility-transfer-letter",
  "template-welcome-letter",
];

export type PortfolioSyncSetup = {
  googleMode: "local" | "real";
  spreadsheetId: string;
  sheetName: string;
  driveRootFolderId: string;
  hasConnectedAccount: boolean;
};

export type PortfolioSyncInput = PortfolioSyncSetup & {
  userId: string;
  adapter: GoogleWorkspaceAdapter;
};

export type PortfolioSyncResult = {
  propertiesSynced: number;
  rootDriveFilesSeen: number;
  driveFilesSynced: number;
  propertyFoldersLinked: number;
  propertyProfilesSynced: number;
  templatesSynced: number;
  textExtracted: number;
  textExtractFailed: number;
  driveFilesRemoved: number;
};

type DocumentTemplateStore = {
  documentTemplate: {
    findFirst(input: {
      where: { userId: string; googleDocId: string };
    }): Promise<{ id: string } | null>;
    update(input: {
      where: { id: string };
      data: {
        name: string;
        description: string;
        googleDocUrl: string;
        localBody: string;
        placeholders: string;
      };
    }): Promise<unknown>;
    create(input: {
      data: {
        userId: string;
        name: string;
        description: string;
        googleDocId: string;
        googleDocUrl: string;
        localBody: string;
        placeholders: string;
      };
    }): Promise<unknown>;
    deleteMany?(input: {
      where: {
        userId: string;
        googleDocId: { in: string[] };
      };
    }): Promise<unknown>;
  };
};

export class PortfolioSyncError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "PortfolioSyncError";
  }
}

export function validatePortfolioSyncSetup(input: PortfolioSyncSetup): void {
  if (input.googleMode !== "real") {
    throw new PortfolioSyncError(
      "Portfolio sync requires GOOGLE_MODE=real.",
      "mode",
    );
  }

  if (!input.spreadsheetId.trim()) {
    throw new PortfolioSyncError(
      "GOOGLE_MASTER_SPREADSHEET_ID is required.",
      "spreadsheet",
    );
  }

  if (!input.sheetName.trim()) {
    throw new PortfolioSyncError("GOOGLE_MASTER_SHEET_NAME is required.", "sheet");
  }

  if (!input.driveRootFolderId.trim()) {
    throw new PortfolioSyncError(
      "GOOGLE_TEST_ROOT_FOLDER_ID is required.",
      "drive-root",
    );
  }

  if (!input.hasConnectedAccount) {
    throw new PortfolioSyncError(
      "Google account is not connected.",
      "google-account",
    );
  }
}

export async function syncPortfolioIndex(
  input: PortfolioSyncInput,
): Promise<PortfolioSyncResult> {
  validatePortfolioSyncSetup(input);

  const db = await getDb();
  const spreadsheetSource = await upsertSourceConnection({
    userId: input.userId,
    kind: "master-spreadsheet",
    name: "Example Property Group Master Spreadsheet",
    googleFileId: input.spreadsheetId,
    googleFileUrl: `https://docs.google.com/spreadsheets/d/${input.spreadsheetId}`,
    status: "syncing",
    metadata: { sheetName: input.sheetName, sourceOfTruth: true },
  });

  let propertyRowsSynced = 0;
  let propertyProfilesSynced = 0;
  try {
    const spreadsheetValues = await input.adapter.readSpreadsheetValues({
      spreadsheetId: input.spreadsheetId,
      range: `'${input.sheetName.replaceAll("'", "''")}'!A:Z`,
    });
    const propertyRows = planSpreadsheetRows({
      spreadsheetId: input.spreadsheetId,
      sheetName: input.sheetName,
      values: spreadsheetValues,
    });
    let seededDuplicatePropertiesRemoved = 0;

    for (const row of propertyRows) {
      const propertyIndex = await db.propertyIndex.upsert({
        where: {
          userId_sourceSpreadsheetId_sourceSheetName_sourceRowNumber: {
            userId: input.userId,
            sourceSpreadsheetId: row.sourceSpreadsheetId,
            sourceSheetName: row.sourceSheetName,
            sourceRowNumber: row.sourceRowNumber,
          },
        },
        update: {
          sourceConnectionId: spreadsheetSource.id,
          address: row.address,
          normalizedAddress: row.normalizedAddress,
          currentTenants: row.currentTenants,
          rentAmount: row.rentAmount,
          leaseStart: row.leaseStart,
          leaseEnd: row.leaseEnd,
          tenantPhone: row.tenantPhone,
          tenantEmail: row.tenantEmail,
          tenantBirthdays: row.tenantBirthdays,
          pets: row.pets,
          owner: row.owner,
          brokerSplit: row.brokerSplit,
          tenantNotes: row.tenantNotes,
          status: row.status,
          rawJson: row.rawJson,
        },
        create: {
          userId: input.userId,
          sourceConnectionId: spreadsheetSource.id,
          sourceSpreadsheetId: row.sourceSpreadsheetId,
          sourceSheetName: row.sourceSheetName,
          sourceRowNumber: row.sourceRowNumber,
          address: row.address,
          normalizedAddress: row.normalizedAddress,
          currentTenants: row.currentTenants,
          rentAmount: row.rentAmount,
          leaseStart: row.leaseStart,
          leaseEnd: row.leaseEnd,
          tenantPhone: row.tenantPhone,
          tenantEmail: row.tenantEmail,
          tenantBirthdays: row.tenantBirthdays,
          pets: row.pets,
          owner: row.owner,
          brokerSplit: row.brokerSplit,
          tenantNotes: row.tenantNotes,
          status: row.status,
          rawJson: row.rawJson,
        },
      });
      const profileRow = planPropertyProfileRow({
        row,
        userId: input.userId,
        propertyIndexId: propertyIndex.id,
      });

      if (profileRow) {
        await db.propertyProfile.upsert({
          where: {
            propertyIndexId: propertyIndex.id,
          },
          update: {
            applianceInfo: profileRow.applianceInfo,
            filterSize: profileRow.filterSize,
            homeWarranty: profileRow.homeWarranty,
            hoaInfo: profileRow.hoaInfo,
            utilityProviders: profileRow.utilityProviders,
            accessCodes: profileRow.accessCodes,
          },
          create: profileRow,
        });
        propertyProfilesSynced += 1;
      }
    }

    const seededDuplicatePropertyWhere =
      buildSeededFixtureDuplicatePropertyCleanupWhere({
        userId: input.userId,
        activeSourceConnectionId: spreadsheetSource.id,
        normalizedAddresses: propertyRows.map((row) => row.normalizedAddress),
      });

    if (seededDuplicatePropertyWhere) {
      const duplicateProperties = await db.propertyIndex.findMany({
        where: seededDuplicatePropertyWhere,
        select: { id: true },
      });
      const duplicatePropertyIds = duplicateProperties.map((property) => property.id);

      if (duplicatePropertyIds.length > 0) {
        await db.generatedDocument.deleteMany({
          where: {
            userId: input.userId,
            propertyIndexId: { in: duplicatePropertyIds },
          },
        });
        const deleted = await db.propertyIndex.deleteMany({
          where: {
            userId: input.userId,
            id: { in: duplicatePropertyIds },
          },
        });
        seededDuplicatePropertiesRemoved = deleted.count;
      }
    }

    await markSourceSynced(spreadsheetSource.id, {
      profileRowsSynced: propertyProfilesSynced,
      rowsSynced: propertyRows.length,
      seededDuplicatePropertiesRemoved,
      sheetName: input.sheetName,
      sourceOfTruth: true,
    });
    propertyRowsSynced = propertyRows.length;
  } catch (error) {
    await markSourceError(spreadsheetSource.id, error);
    throw error;
  }

  const driveSource = await upsertSourceConnection({
    userId: input.userId,
    kind: "drive-root",
    name: "Example Property Group Drive Root",
    googleFileId: input.driveRootFolderId,
    googleFileUrl: `https://drive.google.com/drive/folders/${input.driveRootFolderId}`,
    status: "syncing",
    metadata: { storageOwner: "Google Drive" },
  });

  try {
    const properties = await db.propertyIndex.findMany({
      where: { userId: input.userId },
      orderBy: { address: "asc" },
    });
    const propertyMatches: SyncPropertyMatch[] = properties.map((property) => ({
      id: property.id,
      address: property.address,
      normalizedAddress: property.normalizedAddress,
    }));
    const rootFiles = await listAllDriveFiles(input.adapter, input.driveRootFolderId);
    const filesByFolderId: Record<string, GoogleDriveFileMetadata[]> = {};
    let propertyFoldersLinked = 0;

    for (const rootFile of rootFiles) {
      if (!isDriveFolder(rootFile)) {
        continue;
      }

      filesByFolderId[rootFile.id] = await listDriveFilesRecursively(
        input.adapter,
        rootFile.id,
      );
      const matchedProperty = findPropertyForDriveName(
        rootFile.name,
        propertyMatches,
      );
      if (!matchedProperty) {
        continue;
      }

      propertyFoldersLinked += 1;
      await db.propertyIndex.update({
        where: { id: matchedProperty.id },
        data: {
          driveFolderId: rootFile.id,
          driveFolderUrl: rootFile.webViewLink,
        },
      });
    }

    const driveRows = planDriveFileRows({
      userId: input.userId,
      sourceConnectionId: driveSource.id,
      properties: propertyMatches,
      rootFiles,
      filesByFolderId,
    });
    const allDriveFiles = [
      ...rootFiles,
      ...Object.values(filesByFolderId).flat(),
    ];
    const textExtraction = await extractTextForDriveRows(
      input.adapter,
      driveRows,
      allDriveFiles,
    );

    for (const row of textExtraction.rows) {
      await db.driveFileIndex.upsert({
        where: {
          userId_googleFileId: {
            userId: input.userId,
            googleFileId: row.googleFileId,
          },
        },
        update: {
          sourceConnectionId: row.sourceConnectionId,
          propertyIndexId: row.propertyIndexId,
          name: row.name,
          mimeType: row.mimeType,
          category: row.category,
          webViewLink: row.webViewLink,
          modifiedTime: row.modifiedTime,
          textExtract: row.textExtract,
        },
        create: row,
      });
    }
    const existingDriveFiles = await db.driveFileIndex.findMany({
      where: { userId: input.userId },
      select: { googleFileId: true },
    });
    const staleGoogleFileIds = findStaleDriveFileIds({
      existingGoogleFileIds: existingDriveFiles.map((file) => file.googleFileId),
      plannedRows: textExtraction.rows,
    });
    const deletedStaleFiles =
      staleGoogleFileIds.length > 0
        ? await db.driveFileIndex.deleteMany({
            where: {
              userId: input.userId,
              googleFileId: { in: staleGoogleFileIds },
            },
          })
        : { count: 0 };
    const templatesSynced = await syncDocumentTemplatesFromDriveRows({
      store: db,
      userId: input.userId,
      driveRows: textExtraction.rows,
    });

    await markSourceSynced(driveSource.id, {
      filesSynced: driveRows.length,
      rootFilesSeen: rootFiles.length,
      storageOwner: "Google Drive",
      templatesSynced,
      textExtracted: textExtraction.textExtracted,
      textExtractFailed: textExtraction.textExtractFailed,
      driveFilesRemoved: deletedStaleFiles.count,
    });

    return {
      propertiesSynced: propertyRowsSynced,
      rootDriveFilesSeen: rootFiles.length,
      driveFilesSynced: driveRows.length,
      propertyFoldersLinked,
      propertyProfilesSynced,
      templatesSynced,
      textExtracted: textExtraction.textExtracted,
      textExtractFailed: textExtraction.textExtractFailed,
      driveFilesRemoved: deletedStaleFiles.count,
    };
  } catch (error) {
    await markSourceError(driveSource.id, error);
    throw error;
  }
}

export function mergeSourceMetadataForSync(
  existingMetadataJson: string | null | undefined,
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...parseSourceMetadata(existingMetadataJson),
    ...metadata,
  };
}

export function buildSeededFixtureDuplicatePropertyCleanupWhere(input: {
  userId: string;
  activeSourceConnectionId: string;
  normalizedAddresses: string[];
}) {
  const normalizedAddresses = Array.from(
    new Set(input.normalizedAddresses.map((address) => address.trim()).filter(Boolean)),
  );

  if (normalizedAddresses.length === 0) {
    return null;
  }

  return {
    userId: input.userId,
    sourceConnectionId: { not: input.activeSourceConnectionId },
    normalizedAddress: { in: normalizedAddresses },
    sourceConnection: {
      is: {
        metadataJson: { contains: hostedFixtureMarker },
      },
    },
  };
}

export function buildSeededFixtureTemplateCleanupWhere(input: {
  userId: string;
  syncedTemplateCount: number;
}) {
  if (input.syncedTemplateCount === 0) {
    return null;
  }

  return {
    userId: input.userId,
    googleDocId: {
      in: hostedSeedTemplateGoogleDocIds,
    },
  };
}

export async function syncDocumentTemplatesFromDriveRows(input: {
  store: DocumentTemplateStore;
  userId: string;
  driveRows: Parameters<typeof planDocumentTemplateRows>[0]["driveRows"];
}): Promise<number> {
  const templateRows = planDocumentTemplateRows({
    userId: input.userId,
    driveRows: input.driveRows,
  });

  for (const row of templateRows) {
    const existing = await input.store.documentTemplate.findFirst({
      where: {
        userId: input.userId,
        googleDocId: row.googleDocId,
      },
    });

    if (existing) {
      await input.store.documentTemplate.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          description: row.description,
          googleDocUrl: row.googleDocUrl,
          localBody: row.localBody,
          placeholders: row.placeholders,
        },
      });
      continue;
    }

    await input.store.documentTemplate.create({
      data: row,
    });
  }

  const cleanupWhere = buildSeededFixtureTemplateCleanupWhere({
    userId: input.userId,
    syncedTemplateCount: templateRows.length,
  });
  if (cleanupWhere && input.store.documentTemplate.deleteMany) {
    await input.store.documentTemplate.deleteMany({ where: cleanupWhere });
  }

  return templateRows.length;
}

async function listAllDriveFiles(
  adapter: GoogleWorkspaceAdapter,
  folderId: string,
): Promise<GoogleDriveFileMetadata[]> {
  const files: GoogleDriveFileMetadata[] = [];
  let pageToken: string | undefined;

  do {
    const page = await adapter.listDriveFiles({ folderId, pageToken });
    files.push(...page.files);
    pageToken = page.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

export async function listDriveFilesRecursively(
  adapter: GoogleWorkspaceAdapter,
  folderId: string,
  visitedFolderIds = new Set<string>(),
): Promise<GoogleDriveFileMetadata[]> {
  if (visitedFolderIds.has(folderId)) {
    return [];
  }

  visitedFolderIds.add(folderId);

  const files = await listAllDriveFiles(adapter, folderId);
  const descendants: GoogleDriveFileMetadata[] = [];

  for (const file of files) {
    descendants.push(file);

    if (isDriveFolder(file)) {
      descendants.push(
        ...(await listDriveFilesRecursively(adapter, file.id, visitedFolderIds)),
      );
    }
  }

  return descendants;
}

async function upsertSourceConnection(input: {
  userId: string;
  kind: string;
  name: string;
  googleFileId: string;
  googleFileUrl: string;
  status: string;
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
        status: input.status,
        metadataJson: JSON.stringify(
          mergeSourceMetadataForSync(existing.metadataJson, input.metadata),
        ),
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
      status: input.status,
      metadataJson: JSON.stringify(input.metadata),
    },
  });
}

async function markSourceSynced(
  sourceConnectionId: string,
  metadata: Record<string, unknown>,
) {
  const db = await getDb();
  const source = await db.sourceConnection.findUnique({
    where: { id: sourceConnectionId },
    select: { metadataJson: true },
  });

  await db.sourceConnection.update({
    where: { id: sourceConnectionId },
    data: {
      status: "synced",
      lastSyncedAt: new Date(),
      metadataJson: JSON.stringify(
        mergeSourceMetadataForSync(source?.metadataJson, metadata),
      ),
    },
  });
}

async function markSourceError(sourceConnectionId: string, error: unknown) {
  const db = await getDb();
  const message = error instanceof Error ? error.message : "Unknown sync error.";
  const source = await db.sourceConnection.findUnique({
    where: { id: sourceConnectionId },
    select: { metadataJson: true },
  });

  await db.sourceConnection.update({
    where: { id: sourceConnectionId },
    data: {
      status: "error",
      metadataJson: JSON.stringify(
        mergeSourceMetadataForSync(source?.metadataJson, { error: message }),
      ),
    },
  });
}

function parseSourceMetadata(
  metadataJson: string | null | undefined,
): Record<string, unknown> {
  if (!metadataJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadataJson);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
