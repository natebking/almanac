import { getDb } from "@/lib/db";
import type { AssistantInput } from "@/lib/assistant/portfolio-assistant";
import { buildDashboardAttentionItems } from "@/lib/dashboard/attention";
import { buildRecentGeneratedDocumentCards } from "@/lib/dashboard/generated-documents";
import { buildRecentPropertyCards } from "@/lib/dashboard/recent-properties";
import { buildHouseProfileItems } from "@/lib/houses/profile-summary";
import type { PortfolioSearchInput } from "@/lib/search/portfolio-search";

export async function getPortfolioSources(userId: string) {
  const db = await getDb();
  return db.sourceConnection.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getPortfolioSearchInput(
  userId: string,
): Promise<PortfolioSearchInput> {
  const db = await getDb();
  const [properties, driveFiles, vendors, templates, generatedDocuments] =
    await Promise.all([
      db.propertyIndex.findMany({
        where: { userId },
        include: { profile: true },
        orderBy: { address: "asc" },
      }),
      db.driveFileIndex.findMany({
        where: { userId },
        orderBy: { modifiedTime: "desc" },
      }),
      db.vendor.findMany({
        where: { userId },
        include: {
          propertyLinks: {
            include: { property: true, propertyIndex: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      db.documentTemplate.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      db.generatedDocument.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return {
    properties: properties.map((property) => ({
      ...property,
      profileText: buildHouseProfileItems(property.profile)
        .map((item) => `${item.label}: ${item.value}`)
        .join(" "),
    })),
    driveFiles,
    vendors: vendors.map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      trade: vendor.trade,
      notes: vendor.notes,
      propertyNames: vendor.propertyLinks
        .map((link) => link.propertyIndex?.address ?? link.property?.address ?? "")
        .filter(Boolean),
    })),
    templates,
    generatedDocuments,
  };
}

export async function getAssistantInput(
  userId: string,
  today = new Date(),
): Promise<AssistantInput> {
  const db = await getDb();
  const [properties, driveFiles, templates, vendors, generatedDocuments] =
    await Promise.all([
      db.propertyIndex.findMany({
        where: { userId },
        include: { profile: true },
        orderBy: { address: "asc" },
      }),
      db.driveFileIndex.findMany({
        where: { userId },
        orderBy: { modifiedTime: "desc" },
      }),
      db.documentTemplate.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      db.vendor.findMany({
        where: { userId },
        include: {
          propertyLinks: {
            include: { property: true, propertyIndex: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      db.generatedDocument.findMany({
        where: { userId },
        include: { property: true, propertyIndex: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

  return {
    today,
    properties,
    driveFiles,
    templates,
    vendors: vendors.map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      trade: vendor.trade,
      phone: vendor.phone,
      email: vendor.email,
      notes: vendor.notes,
      licenseStatus: vendor.licenseStatus,
      insuranceStatus: vendor.insuranceStatus,
      propertyLinks: vendor.propertyLinks.flatMap((link) => {
        const property = link.propertyIndex ?? link.property;

        return property ? [{ id: property.id, address: property.address }] : [];
      }),
    })),
    generatedDocuments: generatedDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      status: document.status,
      renderedBody: document.renderedBody,
      pdfUrl: document.pdfUrl,
      googleDocUrl: document.googleDocUrl,
      errorMessage: document.errorMessage,
      propertyIndexId: document.propertyIndexId,
      propertyAddress:
        document.propertyIndex?.address ?? document.property?.address ?? null,
      createdAt: document.createdAt,
    })),
  };
}

export async function getHouse(userId: string, id: string) {
  const db = await getDb();
  return db.propertyIndex.findFirst({
    where: { id, userId },
    include: {
      driveFiles: {
        orderBy: [{ category: "asc" }, { modifiedTime: "desc" }],
      },
      generatedDocs: {
        include: { property: true, propertyIndex: true },
        orderBy: { createdAt: "desc" },
      },
      profile: true,
      sourceConnection: true,
    },
  });
}

export async function getDashboardData(userId: string, today = new Date()) {
  const db = await getDb();
  const [
    properties,
    recentFiles,
    generatedDocuments,
    projects,
    recentConversations,
    recentPropertyVisits,
  ] = await Promise.all([
      db.propertyIndex.findMany({
        where: { userId },
        orderBy: { address: "asc" },
      }),
      db.driveFileIndex.findMany({
        where: { userId },
        orderBy: { modifiedTime: "desc" },
        take: 5,
      }),
      db.generatedDocument.findMany({
        where: { userId },
        include: { property: true, propertyIndex: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      db.driveFileIndex.findMany({
        where: { userId, category: "project" },
        include: { propertyIndex: true },
        orderBy: { modifiedTime: "desc" },
      }),
      db.aiConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      db.propertyVisit.findMany({
        where: { userId },
        include: { propertyIndex: true },
        orderBy: { openedAt: "desc" },
        take: 5,
      }),
    ]);

  const leaseExpirations = properties.filter((property) => {
    if (!property.leaseEnd) {
      return false;
    }
    const leaseEnd = new Date(`${property.leaseEnd}T00:00:00.000Z`);
    const days = Math.ceil((leaseEnd.getTime() - today.getTime()) / 86_400_000);
    return days >= 0 && days <= 90;
  });
  const vacantProperties = properties.filter((property) =>
    property.status.toLowerCase().includes("vacant"),
  );
  const attentionItems = buildDashboardAttentionItems({
    today,
    properties,
    projects,
    generatedDocuments,
  });
  const recentGeneratedDocuments =
    buildRecentGeneratedDocumentCards(generatedDocuments);
  const recentProperties = buildRecentPropertyCards(recentPropertyVisits);

  return {
    properties,
    attentionItems,
    leaseExpirations,
    vacantProperties,
    recentFiles,
    generatedDocuments,
    recentGeneratedDocuments,
    projects,
    recentConversations,
    recentProperties,
  };
}
