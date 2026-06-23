import type { DashboardAttentionTone } from "@/lib/dashboard/attention";

export type RecentGeneratedDocumentSource = {
  id: string;
  title: string;
  status: string;
  pdfUrl: string | null;
  googleDocUrl: string | null;
  property: { address: string } | null;
  propertyIndex: { address: string } | null;
};

export type RecentGeneratedDocumentCard = {
  id: string;
  title: string;
  propertyAddress: string;
  status: string;
  reviewHref: string;
  printHref: string | null;
  googleDocHref: string | null;
  tone: DashboardAttentionTone;
};

export function buildRecentGeneratedDocumentCards(
  documents: RecentGeneratedDocumentSource[],
): RecentGeneratedDocumentCard[] {
  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    propertyAddress:
      document.propertyIndex?.address ?? document.property?.address ?? "Property",
    status: document.status,
    reviewHref: `/documents?generated=${document.id}`,
    printHref: document.pdfUrl,
    googleDocHref: document.googleDocUrl?.startsWith("https://docs.google.com")
      ? document.googleDocUrl
      : null,
    tone: document.status === "generated" ? "success" : "danger",
  }));
}
