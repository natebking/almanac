import { formatGeneratedDocumentError } from "@/lib/documents/errors";

export type GeneratedDocumentReviewSource = {
  id: string;
  title: string;
  status: string;
  renderedBody: string;
  pdfUrl: string | null;
  googleDocUrl: string | null;
  errorMessage: string | null;
  property: { address: string } | null;
  propertyIndex: { address: string } | null;
};

export type GeneratedDocumentReview = {
  id: string;
  title: string;
  propertyAddress: string;
  status: string;
  renderedBody: string;
  pdfUrl: string | null;
  googleDocUrl: string | null;
  hasGoogleDoc: boolean;
  errorMessage: string | null;
};

export function buildGeneratedDocumentReview(input: {
  documents: GeneratedDocumentReviewSource[];
  selectedGeneratedId: string;
}): GeneratedDocumentReview | null {
  if (!input.selectedGeneratedId) {
    return null;
  }

  const document = input.documents.find(
    (item) => item.id === input.selectedGeneratedId,
  );

  if (!document) {
    return null;
  }

  return {
    id: document.id,
    title: document.title,
    propertyAddress:
      document.propertyIndex?.address ?? document.property?.address ?? "Property",
    status: document.status,
    renderedBody: document.renderedBody,
    pdfUrl: document.pdfUrl,
    googleDocUrl: document.googleDocUrl,
    hasGoogleDoc: Boolean(
      document.googleDocUrl?.startsWith("https://docs.google.com"),
    ),
    errorMessage: formatGeneratedDocumentError(document.errorMessage),
  };
}
