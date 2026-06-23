export type GeneratedDocumentQueueSource = {
  id: string;
  title: string;
  status: string;
  pdfUrl: string | null;
  googleDocUrl: string | null;
  property: { address: string } | null;
  propertyIndex: { address: string } | null;
};

export type GeneratedDocumentQueueItem = {
  id: string;
  title: string;
  propertyAddress: string;
  status: string;
  reviewHref: string;
  printHref: string;
  googleDocHref: string | null;
};

export function buildGeneratedDocumentQueue(
  documents: GeneratedDocumentQueueSource[],
): GeneratedDocumentQueueItem[] {
  return documents
    .filter((document) => document.status === "generated" && document.pdfUrl)
    .map((document) => ({
      id: document.id,
      title: document.title,
      propertyAddress:
        document.propertyIndex?.address ?? document.property?.address ?? "Property",
      status: document.status,
      reviewHref: `/documents?generated=${document.id}`,
      printHref: document.pdfUrl ?? "",
      googleDocHref: document.googleDocUrl?.startsWith("https://docs.google.com")
        ? document.googleDocUrl
        : null,
    }));
}
