import {
  buildRecentGeneratedDocumentCards,
  type RecentGeneratedDocumentCard,
  type RecentGeneratedDocumentSource,
} from "@/lib/dashboard/generated-documents";

export type HouseGeneratedDocumentCard = RecentGeneratedDocumentCard;
export type HouseGeneratedDocumentSource = RecentGeneratedDocumentSource;

export function buildHouseGeneratedDocumentCards(
  documents: HouseGeneratedDocumentSource[],
): HouseGeneratedDocumentCard[] {
  return buildRecentGeneratedDocumentCards(documents);
}
