import "dotenv/config";
import type { PrismaClient as PrismaClientType } from "../src/generated/prisma/client";
import { extractPlaceholders } from "../src/lib/placeholders";
import { parseMasterSpreadsheetRows } from "../src/lib/spreadsheet/property-rows";

// Sample seed data only. Do not put real tenant, owner, vendor, property, or
// account details in this file.

// Adapters are imported dynamically so this module can be imported by the
// serverless demo-reset route without bundling the native SQLite adapter. The
// unpooled connection is preferred (Neon's pooler does not support the seed's
// bulk operations reliably).
export async function createSeedClient(): Promise<PrismaClientType> {
  const databaseUrl =
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.DATABASE_URL ??
    "file:./prisma/dev.db";
  const { PrismaClient } = await import("../src/generated/prisma/client");
  if (getDatabaseProvider(databaseUrl) === "postgres") {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    return new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
  }
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });
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

export async function seedDatabase(prisma: PrismaClientType) {
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.propertyVisit.deleteMany();
  await prisma.propertyProfile.deleteMany();
  await prisma.driveFileIndex.deleteMany();
  await prisma.propertyIndex.deleteMany();
  await prisma.sourceConnection.deleteMany();
  await prisma.vendorPropertyLink.deleteMany();
  await prisma.generatedDocument.deleteMany();
  await prisma.task.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.property.deleteMany();

  const user = await prisma.user.upsert({
    where: { email: "alpha-user@example.com" },
    update: {},
    create: {
      email: "alpha-user@example.com",
      name: "Monty Banks",
    },
  });

  const summary = await seedSamplePortfolio(prisma, user.id);
  console.log("Seed complete", { user: user.email, ...summary });
}

// Build the sample Monopoly portfolio for one user. No wipe and no user
// creation, so it is safe to call per visitor to populate a fresh demo sandbox.
//
// Every date is relative to `today` so the public demo never goes stale: one
// lease is about to expire, one has lapsed, one tenant moves in soon, and a
// birthday is coming up, whatever day the sandbox is created.
export async function seedSamplePortfolio(
  prisma: PrismaClientType,
  userId: string,
  today: Date = new Date(),
) {
  const base = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const at = (days: number, hour = 12) =>
    new Date(base + days * 86_400_000 + hour * 3_600_000);
  const isoDay = (days: number) => at(days).toISOString().slice(0, 10);
  // Later this month (or today on the last day), so "birthdays this month" and
  // the radar both have something to show.
  const upcomingBirthdayThisMonth = () => {
    const now = at(0);
    const lastDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const month = now.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
    return `${month} ${Math.min(now.getUTCDate() + 2, lastDay)}`;
  };
  const longDay = (days: number) =>
    at(days).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  const spreadsheetSource = await prisma.sourceConnection.create({
    data: {
      userId,
      kind: "master-spreadsheet",
      name: "Example Property Group Master Spreadsheet",
      googleFileId: "sample-master-spreadsheet",
      googleFileUrl: "https://docs.google.com/spreadsheets/d/sample-master-spreadsheet",
      status: "synced",
      lastSyncedAt: at(-1, 12),
      metadataJson: JSON.stringify({
        sourceOfTruth: true,
        sheetName: "Rentals",
      }),
    },
  });

  const driveSource = await prisma.sourceConnection.create({
    data: {
      userId,
      kind: "drive-root",
      name: "Example Property Group Drive Root",
      googleFileId: "sample-drive-root",
      googleFileUrl: "https://drive.google.com/drive/folders/sample-drive-root",
      status: "indexed",
      lastSyncedAt: at(-1, 12.2),
      metadataJson: JSON.stringify({
        storageOwner: "Google Drive",
      }),
    },
  });

  const indexedRows = parseMasterSpreadsheetRows({
    spreadsheetId: "sample-master-spreadsheet",
    sheetName: "Rentals",
    headers: [
      "Property Address",
      "Current Tenant(s)",
      "Rent Amount",
      "Lease Start",
      "Lease End",
      "Tenant Phone",
      "Tenant Email",
      "Tenant Birthday(s)",
      "Pets",
      "Owner",
      "Broker Split",
      "Tenant Notes",
      "Status",
      "Appliances",
      "Filter Size",
      "Home Warranty",
      "HOA",
      "Utility Providers",
      "Access Codes",
    ],
    rows: [
      [
        "Boardwalk",
        "Avery Johnson",
        "$2,450",
        isoDay(-296),
        isoDay(69),
        "555-0144",
        "avery@example.com",
        "Avery Johnson: June 20",
        "1 dog",
        "Example Property Group",
        "70 / 30",
        "Prefers text messages.",
        "Active",
        "Fridge LG LFXS26973. Dishwasher Bosch 300.",
        "16x20x1",
        `Choice Home Warranty through ${isoDay(84)}.`,
        "No HOA on file.",
        "Electric: City Power. Water: City Water. Trash: Friday.",
        "Gate: 2468. Garage: 1357.",
      ],
      [
        "Park Place",
        "Mia Chen",
        "$2,850",
        isoDay(-340),
        isoDay(25),
        "555-0199",
        "mia@example.com",
        `Mia Chen: ${upcomingBirthdayThisMonth()}`,
        "No pets",
        "Example Property Group",
        "70 / 30",
        "Lease renewal decision needed.",
        "Active",
        "Water heater installed 2024. Washer and dryer tenant-owned.",
        "20x25x1",
        "No active home warranty on file.",
        "HOA contact: verona-hoa@example.com.",
        "Electric: City Power. Gas: Valley Gas.",
        "Front door smart lock: 9090.",
      ],
      [
        "Marvin Gardens",
        "Noah Patel",
        "$2,200",
        isoDay(-377),
        isoDay(-12),
        "555-0112",
        "noah@example.com",
        "Noah Patel: September 4",
        "Cat",
        "Example Property Group",
        "65 / 35",
        "Month-to-month holdover. Renewal paperwork not signed yet.",
        "Active",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "Baltic Avenue",
        "",
        "$0",
        "",
        "",
        "",
        "",
        "",
        "",
        "Example Property Group",
        "70 / 30",
        "Vacant and ready for showing.",
        "Vacant",
        "Appliance set pending remodel completion.",
        "20x20x1",
        "No active warranty on file.",
        "HOA approval needed before exterior work.",
        "Electric and water active under owner during vacancy.",
        "Contractor lockbox: 4411.",
      ],
      [
        "Pennsylvania Avenue",
        "Olivia Martin",
        "$3,150",
        isoDay(-265),
        isoDay(100),
        "555-0181",
        "olivia@example.com",
        "Olivia Martin: January 22",
        "2 dogs",
        "Example Property Group",
        "75 / 25",
        "Recent maintenance completed on HVAC.",
        "Active",
        "Two HVAC zones. Kitchen fridge replaced in 2025.",
        "20x25x4",
        `Warranty covers HVAC through ${isoDay(38)}.`,
        "HOA requires 48-hour notice for exterior vendors.",
        "Electric: City Power. Water: Pennsylvania Avenue Utility District.",
        "Side gate: 7788.",
      ],
      [
        "Reading Railroad",
        "Elliot Reed",
        "$2,675",
        isoDay(12),
        isoDay(376),
        "555-0161",
        "elliot@example.com",
        "Elliot Reed: June 27",
        "No pets",
        "Example Property Group",
        "70 / 30",
        "New tenant. Keys and garage code handoff on move-in day.",
        "Active",
        "Garage opener battery replaced May 2026.",
        "14x20x1",
        `Home warranty renewal review due ${isoDay(101)}.`,
        "No HOA on file.",
        "Electric: City Power. Internet: Tenant-managed.",
        "Garage code: 1616. Gate call box under Example Property Group.",
      ],
    ],
  });

  const propertyIndexByAddress = new Map<string, { id: string; address: string }>();
  for (const row of indexedRows) {
    const propertyIndex = await prisma.propertyIndex.create({
      data: {
        userId,
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
        driveFolderId: `folder-${row.normalizedAddress.replaceAll(" ", "-")}`,
        driveFolderUrl: `https://drive.google.com/drive/folders/folder-${row.normalizedAddress.replaceAll(" ", "-")}`,
        rawJson: row.rawJson,
      },
    });
    propertyIndexByAddress.set(row.address, propertyIndex);
  }

  const propertyId = (address: string) => propertyIndexByAddress.get(address)?.id ?? null;
  const propertyIndexId = (address: string) => {
    const id = propertyId(address);
    if (!id) {
      throw new Error(`Missing indexed property ${address}`);
    }
    return id;
  };

  const profileRows = indexedRows.flatMap((row) => {
    const propertyIndexId = propertyId(row.address);

    return row.profile && propertyIndexId
      ? [{ userId, propertyIndexId, ...row.profile }]
      : [];
  });

  if (profileRows.length > 0) {
    await prisma.propertyProfile.createMany({
      data: profileRows,
    });
  }

  await prisma.driveFileIndex.createMany({
    data: [
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: propertyId("Boardwalk"),
        googleFileId: "lease-loch-lomand",
        name: "Boardwalk Lease",
        mimeType: "application/pdf",
        category: "lease",
        webViewLink: "https://drive.google.com/file/d/lease-loch-lomand",
        modifiedTime: at(-22),
        textExtract: "Lease for Boardwalk. Tenant Avery Johnson.",
      },
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: propertyId("Park Place"),
        googleFileId: "application-verona",
        name: "Park Place Application",
        mimeType: "application/pdf",
        category: "application",
        webViewLink: "https://drive.google.com/file/d/application-verona",
        modifiedTime: at(-34),
        textExtract: "Rental application for Park Place. Tenant Mia Chen.",
      },
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: propertyId("Baltic Avenue"),
        googleFileId: "photos-wood-court",
        name: "Baltic Avenue Photos",
        mimeType: "application/vnd.google-apps.folder",
        category: "photos",
        webViewLink: "https://drive.google.com/drive/folders/photos-wood-court",
        modifiedTime: at(-18),
        textExtract: "Photos for vacant Baltic Avenue listing.",
      },
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: propertyId("Pennsylvania Avenue"),
        googleFileId: "maintenance-estates",
        name: "Pennsylvania Avenue HVAC Maintenance Invoice",
        mimeType: "application/pdf",
        category: "maintenance",
        webViewLink: "https://drive.google.com/file/d/maintenance-estates",
        modifiedTime: at(-16),
        textExtract: "HVAC maintenance completed at Pennsylvania Avenue.",
      },
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: propertyId("Reading Railroad"),
        googleFileId: "lease-161-maiden-lane",
        name: "Reading Railroad Lease",
        mimeType: "application/pdf",
        category: "lease",
        webViewLink: "https://drive.google.com/file/d/lease-161-maiden-lane",
        modifiedTime: at(-74),
        textExtract: "Lease for Reading Railroad. Tenant Elliot Reed.",
      },
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: propertyId("Marvin Gardens"),
        googleFileId: "financial-st-paul",
        name: "Marvin Gardens Owner Statement",
        mimeType: "application/pdf",
        category: "financial",
        webViewLink: "https://drive.google.com/file/d/financial-st-paul",
        modifiedTime: at(-13),
        textExtract: "Owner statement and deposited check for Marvin Gardens.",
      },
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: propertyId("Baltic Avenue"),
        googleFileId: "project-wood-court",
        name: "Baltic Avenue Remodel Scope",
        mimeType: "application/vnd.google-apps.document",
        category: "project",
        webViewLink: "https://docs.google.com/document/d/project-wood-court",
        modifiedTime: at(-11),
        textExtract: "Active remodel scope for Baltic Avenue.",
      },
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: null,
        googleFileId: "template-move-in-checklist",
        name: "Move-In Checklist",
        mimeType: "application/vnd.google-apps.document",
        category: "template",
        webViewLink: "https://docs.google.com/document/d/template-move-in-checklist",
        modifiedTime: at(-20),
        textExtract: "Reusable Move-In Checklist template.",
      },
      {
        userId,
        sourceConnectionId: driveSource.id,
        propertyIndexId: null,
        googleFileId: "materials-tenant-overview",
        name: "Tenant Overview",
        mimeType: "application/vnd.google-apps.document",
        category: "material",
        webViewLink: "https://docs.google.com/document/d/materials-tenant-overview",
        modifiedTime: at(-53),
        textExtract: "Reference material for tenant overview.",
      },
    ],
  });

  const oak = await prisma.property.create({
    data: {
      userId,
      address: "123 Oak Street",
      ownerName: "Taylor Morgan",
      tenantName: "Jordan Lee",
      notes: "Sample alpha property for document generation.",
      utilityNotes: "Electric: City Power. Water: City Water.",
      accessCodes: "Gate: 2468. Garage: 1357.",
      applianceNotes: "Fridge model FR-100. Washer model WA-200.",
      filterSize: "16x20x1",
      warrantyNotes: "Home warranty expires 2027-01-15.",
      hoaNotes: "HOA contact: hoa@example.com.",
    },
  });

  const pine = await prisma.property.create({
    data: {
      userId,
      address: "45 Pine Avenue",
      ownerName: "Alex Rivera",
      tenantName: "Casey Smith",
      notes: "Second sample property for layout and list testing.",
      utilityNotes: "Trash pickup Friday.",
      accessCodes: "Front door: 9090.",
      applianceNotes: "Water heater installed 2024.",
      filterSize: "20x25x1",
      warrantyNotes: "No active warranty on file.",
      hoaNotes: "No HOA.",
    },
  });

  const plumber = await prisma.vendor.create({
    data: {
      userId,
      name: "Reliable Plumbing",
      trade: "Plumbing",
      phone: "555-0101",
      email: "dispatch@reliable.example",
      notes: "Fast response on leak calls.",
      licenseStatus: "License on file",
      insuranceStatus: "Insurance on file",
      propertyLinks: {
        create: [
          { propertyIndexId: propertyIndexId("Boardwalk") },
          { propertyIndexId: propertyIndexId("Park Place") },
        ],
      },
    },
  });

  await prisma.vendor.create({
    data: {
      userId,
      name: "Clear Air HVAC",
      trade: "HVAC",
      phone: "555-0188",
      email: "service@clearair.example",
      notes: "Use for seasonal maintenance.",
      licenseStatus: "Needs renewal check",
      insuranceStatus: "Insurance on file",
      propertyLinks: {
        create: [{ propertyIndexId: propertyIndexId("Pennsylvania Avenue") }],
      },
    },
  });

  const localBody = [
    "Move-In Checklist",
    "",
    "Tenant: {{tenant_name}}",
    "Property: {{property_address}}",
    "Move-in date: {{move_in_date}}",
    "",
    "- Confirm keys are delivered.",
    "- Confirm utilities are transferred.",
    "- Confirm filter size: {{filter_size}}.",
  ].join("\n");

  const template = await prisma.documentTemplate.create({
    data: {
      userId,
      name: "Move-In Checklist",
      description: "Sample checklist template with property placeholders.",
      googleDocId: "template-move-in-checklist",
      googleDocUrl: "https://docs.google.com/document/d/template-move-in-checklist",
      localBody,
      placeholders: JSON.stringify(extractPlaceholders(localBody)),
    },
  });

  // The checklist for the upcoming Reading Railroad move-in, already generated
  // and ready to print. Its print link must point at its own id, the same way
  // generateDocumentForUser sets it.
  const sampleDocument = await prisma.generatedDocument.create({
    data: {
      userId,
      propertyIndexId: propertyId("Reading Railroad"),
      templateId: template.id,
      title: "Move-In Checklist - Reading Railroad",
      status: "generated",
      renderedBody: localBody
        .replace("{{tenant_name}}", "Elliot Reed")
        .replace("{{property_address}}", "Reading Railroad")
        .replace("{{move_in_date}}", longDay(12))
        .replace("{{filter_size}}", "14x20x1"),
      fieldValuesJson: JSON.stringify({
        tenant_name: "Elliot Reed",
        property_address: "Reading Railroad",
        move_in_date: longDay(12),
        filter_size: "14x20x1",
      }),
    },
  });
  await prisma.generatedDocument.update({
    where: { id: sampleDocument.id },
    data: { pdfUrl: `/api/documents/pdf/${sampleDocument.id}` },
  });

  await prisma.propertyVisit.createMany({
    data: [
      {
        userId,
        propertyIndexId: propertyIndexId("Boardwalk"),
        openedAt: at(-1, 13.5),
      },
      {
        userId,
        propertyIndexId: propertyIndexId("Baltic Avenue"),
        openedAt: at(-1, 12.75),
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        userId,
        propertyId: oak.id,
        title: "Review generated move-in checklist",
        status: "open",
        kind: "document",
        dueDate: at(5, 16),
      },
      {
        userId,
        propertyId: pine.id,
        title: "Check HVAC filter size before renewal packet",
        status: "open",
        kind: "maintenance",
        dueDate: at(7, 16),
      },
    ],
  });

  return {
    properties: [oak.address, pine.address],
    vendors: [plumber.name, "Clear Air HVAC"],
    template: template.name,
  };
}

// CLI entry: run only when this file is executed directly (npm run db:seed),
// never when imported by the app (session.ts) or the demo-reset route. The
// NEXT_RUNTIME guard makes this impossible to trigger inside the Next server.
const runDirectly =
  !process.env.NEXT_RUNTIME && Boolean(process.argv[1]?.endsWith("seed.ts"));

if (runDirectly) {
  void createSeedClient().then(async (prisma) => {
    try {
      await seedDatabase(prisma);
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  });
}
