import dotenv from "dotenv";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { alphaTesterEmail } from "../src/lib/alpha-config";
import {
  buildHostedDummySeedPlan,
  formatHostedDummySeedPlan,
  hostedDummyDriveFiles,
  hostedDummyProperties,
  hostedDummyTemplates,
  hostedDummyVendors,
  validateHostedDummySeedTarget,
} from "../src/lib/fixtures/hosted-dummy-seed";
import { extractPlaceholders, replacePlaceholders } from "../src/lib/placeholders";
import { normalizeSearchText } from "../src/lib/spreadsheet/property-rows";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({
  path: ".env.local",
  override: !process.env.VERCEL_ENV,
  quiet: true,
});

const confirmPhrase = "seed-dummy-alpha";
const fixtureMarker = "almanac-hosted-dummy";
const targetEmail = validateHostedDummySeedTarget({
  targetEmail: process.env.ALMANAC_ALPHA_SEED_EMAIL || alphaTesterEmail,
  allowedEmails: process.env.ALMANAC_ALLOWED_EMAILS,
});
const plan = buildHostedDummySeedPlan(targetEmail);
const shouldSeed =
  process.env.ALMANAC_ALPHA_SEED_CONFIRM === confirmPhrase &&
  !process.argv.includes("--dry-run");

console.log(formatHostedDummySeedPlan(plan));

if (!shouldSeed) {
  console.log(
    `Dry run only. Set ALMANAC_ALPHA_SEED_CONFIRM=${confirmPhrase} to write these records.`,
  );
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter =
  getDatabaseProvider(databaseUrl) === "postgres"
    ? new PrismaPg(databaseUrl)
    : new PrismaBetterSqlite3({ url: databaseUrl });
const db = new PrismaClient({ adapter });

seedHostedDummyPortfolio()
  .then((result) => {
    console.log("Seed complete", result);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

async function seedHostedDummyPortfolio() {
  const user = await db.user.upsert({
    where: { email: targetEmail },
    update: { name: "Dummy Almanac Test" },
    create: {
      email: targetEmail,
      name: "Dummy Almanac Test",
    },
  });

  await clearExistingDummyRecords(user.id);

  const spreadsheetSource = await db.sourceConnection.create({
    data: {
      userId: user.id,
      kind: "master-spreadsheet",
      name: "Almanac Test Master Spreadsheet",
      googleFileId: "almanac-test-master-spreadsheet",
      googleFileUrl:
        "https://docs.google.com/spreadsheets/d/almanac-test-master-spreadsheet",
      status: "seeded",
      lastSyncedAt: new Date("2026-06-17T12:00:00.000Z"),
      metadataJson: JSON.stringify({
        fixture: fixtureMarker,
        sheetName: "Rentals",
        sourceOfTruth: true,
      }),
    },
  });
  const driveSource = await db.sourceConnection.create({
    data: {
      userId: user.id,
      kind: "drive-root",
      name: "Almanac Test Portfolio",
      googleFileId: "almanac-test-portfolio",
      googleFileUrl:
        "https://drive.google.com/drive/folders/almanac-test-portfolio",
      status: "seeded",
      lastSyncedAt: new Date("2026-06-17T12:05:00.000Z"),
      metadataJson: JSON.stringify({
        fixture: fixtureMarker,
        storageOwner: "Google Drive",
      }),
    },
  });

  const propertyIndexByAddress = new Map<string, string>();
  for (const [index, property] of hostedDummyProperties.entries()) {
    const row = await db.propertyIndex.create({
      data: {
        userId: user.id,
        sourceConnectionId: spreadsheetSource.id,
        sourceSpreadsheetId: "almanac-test-master-spreadsheet",
        sourceSheetName: "Rentals",
        sourceRowNumber: index + 2,
        address: property.address,
        normalizedAddress: normalizeSearchText(property.address),
        currentTenants: property.currentTenants,
        rentAmount: property.rentAmount,
        leaseStart: property.leaseStart,
        leaseEnd: property.leaseEnd,
        tenantPhone: property.tenantPhone,
        tenantEmail: property.tenantEmail,
        tenantBirthdays: property.tenantBirthdays,
        pets: property.pets,
        owner: property.owner,
        brokerSplit: property.brokerSplit,
        tenantNotes: property.tenantNotes,
        status: property.status,
        driveFolderId: `folder-${normalizeSearchText(property.address).replaceAll(" ", "-")}`,
        driveFolderUrl: `https://drive.google.com/drive/folders/folder-${normalizeSearchText(property.address).replaceAll(" ", "-")}`,
        rawJson: JSON.stringify(property),
      },
    });
    propertyIndexByAddress.set(property.address, row.id);
    await db.propertyProfile.create({
      data: {
        userId: user.id,
        propertyIndexId: row.id,
        applianceInfo: property.profile.applianceInfo,
        filterSize: property.profile.filterSize,
        homeWarranty: property.profile.homeWarranty,
        hoaInfo: property.profile.hoaInfo,
        utilityProviders: property.profile.utilityProviders,
        accessCodes: property.profile.accessCodes,
      },
    });
  }

  await db.driveFileIndex.createMany({
    data: hostedDummyDriveFiles.map((file) => ({
      userId: user.id,
      sourceConnectionId: driveSource.id,
      propertyIndexId: propertyIndexByAddress.get(file.propertyAddress) ?? null,
      googleFileId: file.googleFileId,
      name: file.name,
      mimeType: file.mimeType,
      category: file.category,
      webViewLink: file.webViewLink,
      modifiedTime: new Date(file.modifiedTime),
      textExtract: file.textExtract,
    })),
  });

  const templateByName = new Map<string, string>();
  for (const template of hostedDummyTemplates) {
    const created = await db.documentTemplate.create({
      data: {
        userId: user.id,
        name: template.name,
        description: template.description,
        googleDocId: template.googleDocId,
        googleDocUrl: template.googleDocUrl,
        localBody: template.localBody,
        placeholders: JSON.stringify(extractPlaceholders(template.localBody)),
      },
    });
    templateByName.set(created.name, created.id);
  }

  for (const vendor of hostedDummyVendors) {
    await db.vendor.create({
      data: {
        userId: user.id,
        name: vendor.name,
        trade: vendor.trade,
        phone: vendor.phone,
        email: vendor.email,
        notes: vendor.notes,
        licenseStatus: vendor.licenseStatus,
        insuranceStatus: vendor.insuranceStatus,
        propertyLinks: {
          create: vendor.propertyAddresses
            .map((address) => propertyIndexByAddress.get(address))
            .filter((id): id is string => Boolean(id))
            .map((propertyIndexId) => ({ propertyIndexId })),
        },
      },
    });
  }

  const checklistTemplate = hostedDummyTemplates.find(
    (template) => template.name === "Move-In Checklist",
  );
  const lochLomand = hostedDummyProperties.find((property) =>
    property.address.includes("Loch Lomand"),
  );
  const checklistTemplateId = templateByName.get("Move-In Checklist");
  const lochLomandId = propertyIndexByAddress.get("161 Loch Lomand Drive");

  if (checklistTemplate && checklistTemplateId && lochLomand && lochLomandId) {
    const fieldValues = {
      tenant_name: lochLomand.currentTenants,
      property_address: lochLomand.address,
      lease_start: lochLomand.leaseStart,
      tenant_phone: lochLomand.tenantPhone,
      filter_size: lochLomand.profile.filterSize,
    };
    const generated = await db.generatedDocument.create({
      data: {
        userId: user.id,
        propertyIndexId: lochLomandId,
        templateId: checklistTemplateId,
        title: "Move-In Checklist - 161 Loch Lomand Drive",
        status: "generated",
        renderedBody: replacePlaceholders(checklistTemplate.localBody, fieldValues),
        fieldValuesJson: JSON.stringify(fieldValues),
        googleDocId: null,
        googleDocUrl: null,
        pdfUrl: null,
        errorMessage: null,
      },
    });
    await db.generatedDocument.update({
      where: { id: generated.id },
      data: { pdfUrl: `/api/documents/pdf/${generated.id}` },
    });
  }

  return {
    user: user.email,
    properties: hostedDummyProperties.length,
    driveFiles: hostedDummyDriveFiles.length,
    vendors: hostedDummyVendors.length,
    templates: hostedDummyTemplates.length,
  };
}

async function clearExistingDummyRecords(userId: string) {
  const propertyAddresses = hostedDummyProperties.map((property) => property.address);
  const templateNames = hostedDummyTemplates.map((template) => template.name);
  const vendorNames = hostedDummyVendors.map((vendor) => vendor.name);
  const driveFileIds = hostedDummyDriveFiles.map((file) => file.googleFileId);
  const existingTemplates = await db.documentTemplate.findMany({
    where: { userId, name: { in: templateNames } },
    select: { id: true },
  });
  const existingProperties = await db.propertyIndex.findMany({
    where: { userId, address: { in: propertyAddresses } },
    select: { id: true },
  });

  await db.generatedDocument.deleteMany({
    where: {
      userId,
      OR: [
        { templateId: { in: existingTemplates.map((template) => template.id) } },
        { title: "Move-In Checklist - 161 Loch Lomand Drive" },
      ],
    },
  });
  await db.driveFileIndex.deleteMany({
    where: { userId, googleFileId: { in: driveFileIds } },
  });
  await db.propertyProfile.deleteMany({
    where: {
      userId,
      propertyIndexId: {
        in: existingProperties.map((property) => property.id),
      },
    },
  });
  await db.vendor.deleteMany({
    where: { userId, name: { in: vendorNames } },
  });
  await db.propertyIndex.deleteMany({
    where: { userId, address: { in: propertyAddresses } },
  });
  await db.documentTemplate.deleteMany({
    where: { userId, name: { in: templateNames } },
  });
  await db.sourceConnection.deleteMany({
    where: { userId, metadataJson: { contains: fixtureMarker } },
  });
}

function getDatabaseProvider(url: string) {
  if (process.env.DATABASE_PROVIDER === "postgres") {
    return "postgres";
  }

  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return "postgres";
  }

  return "sqlite";
}
