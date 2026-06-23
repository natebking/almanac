import type {
  AssistantCitation,
  AssistantInput,
} from "@/lib/assistant/portfolio-assistant";
import { formatGeneratedDocumentError } from "@/lib/documents/errors";

export type AssistantSourceCard = {
  label: string;
  href: string;
  actionLabel: string;
  sourceType: string;
  detail: string;
  generatedActions?: {
    reviewHref: string;
    printHref: string | null;
    googleDocHref: string | null;
  };
  target?: "_blank";
};

export function buildAssistantSourceCards(
  citations: AssistantCitation[],
  input: AssistantInput,
): AssistantSourceCard[] {
  return citations.map((citation) => {
    const property = propertyForCitation(citation, input);
    if (property) {
      return {
        label: citation.label,
        href: citation.href,
        actionLabel: "Open house",
        sourceType: "Master spreadsheet",
        detail: [
          `Tenant(s): ${property.currentTenants || "None listed"}`,
          `Rent: ${property.rentAmount || "Not listed"}`,
          `Lease start: ${property.leaseStart || "Not listed"}`,
          `Lease end: ${property.leaseEnd || "Not listed"}`,
          `Birthdays: ${property.tenantBirthdays || "Not listed"}`,
          property.tenantNotes ? `Notes: ${property.tenantNotes}` : "",
          `Status: ${property.status || "Not listed"}`,
        ]
          .filter(Boolean)
          .join(" - "),
      };
    }

    const file = input.driveFiles.find((item) => item.webViewLink === citation.href);
    if (file) {
      return {
        label: citation.label,
        href: citation.href,
        actionLabel: "Open file",
        sourceType: "Google Drive",
        detail: [file.category, file.textExtract].filter(Boolean).join(" - "),
        ...externalLinkProps(citation.href),
      };
    }

    const driveFolderProperty = input.properties.find(
      (item) => item.driveFolderUrl === citation.href,
    );
    if (driveFolderProperty) {
      return {
        label: citation.label,
        href: citation.href,
        actionLabel: "Open folder",
        sourceType: "Property Drive folder",
        detail: `Opens the Google Drive folder linked to ${driveFolderProperty.address}.`,
        ...externalLinkProps(citation.href),
      };
    }

    const vendor = vendorForCitation(citation, input);
    if (vendor) {
      return {
        label: citation.label,
        href: citation.href,
        actionLabel: "Open vendor",
        sourceType: "Vendor directory",
        detail: [
          vendor.trade,
          vendor.phone ? `Phone: ${vendor.phone}` : "",
          vendor.email ? `Email: ${vendor.email}` : "",
          vendor.licenseStatus ? `License: ${vendor.licenseStatus}` : "",
          vendor.insuranceStatus ? `Insurance: ${vendor.insuranceStatus}` : "",
          vendor.propertyLinks.length > 0
            ? `Properties: ${vendor.propertyLinks
                .map((property) => property.address)
                .join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(" - "),
      };
    }

    const generatedDocument = generatedDocumentForCitation(citation, input);
    if (generatedDocument) {
      const errorMessage = formatGeneratedDocumentError(
        generatedDocument.errorMessage,
      );

      return {
        label: citation.label,
        href: citation.href,
        actionLabel: "Review",
        sourceType: "Generated document",
        detail: [
          generatedDocument.status,
          generatedDocument.propertyAddress ?? "",
          generatedDocument.pdfUrl ? "PDF ready" : "",
          generatedDocument.googleDocUrl ? "Google Doc linked" : "",
          errorMessage ? `Error: ${errorMessage}` : "",
        ]
          .filter(Boolean)
          .join(" - "),
        generatedActions: {
          reviewHref: citation.href,
          printHref: generatedDocument.pdfUrl ?? null,
          googleDocHref: generatedDocument.googleDocUrl?.startsWith(
            "https://docs.google.com",
          )
            ? generatedDocument.googleDocUrl
            : null,
        },
      };
    }

    const workflowDetail = documentWorkflowDetail(citation.href, input);
    if (workflowDetail) {
      return {
        label: citation.label,
        href: citation.href,
        actionLabel: "Generate",
        sourceType: "Document workflow",
        detail: workflowDetail,
      };
    }

    return {
      label: citation.label,
      href: citation.href,
      actionLabel: "Open source",
      sourceType: "Source",
      detail: "Open the linked source to review it.",
      ...externalLinkProps(citation.href),
    };
  });
}

function externalLinkProps(href: string): Pick<AssistantSourceCard, "target"> {
  return href.startsWith("http") ? { target: "_blank" } : {};
}

function propertyForCitation(citation: AssistantCitation, input: AssistantInput) {
  const match = citation.href.match(/^\/houses\/([^/?#]+)/);

  if (!match) {
    return null;
  }

  return input.properties.find((property) => property.id === match[1]) ?? null;
}

function vendorForCitation(citation: AssistantCitation, input: AssistantInput) {
  const match = citation.href.match(/^\/vendors#([^/?#]+)/);

  if (!match) {
    return null;
  }

  return input.vendors?.find((vendor) => vendor.id === match[1]) ?? null;
}

function generatedDocumentForCitation(
  citation: AssistantCitation,
  input: AssistantInput,
) {
  if (!citation.href.startsWith("/documents?")) {
    return null;
  }

  const params = new URLSearchParams(citation.href.split("?")[1]);
  const generatedId = params.get("generated");

  if (!generatedId) {
    return null;
  }

  return (
    input.generatedDocuments?.find((document) => document.id === generatedId) ?? null
  );
}

function documentWorkflowDetail(href: string, input: AssistantInput): string | null {
  if (!href.startsWith("/documents?")) {
    return null;
  }

  const params = new URLSearchParams(href.split("?")[1]);
  const property = input.properties.find(
    (item) => item.id === params.get("property"),
  );
  const template = input.templates?.find(
    (item) => item.id === params.get("template"),
  );

  if (!property || !template) {
    return "Opens a document review flow before creating a copy.";
  }

  return `Prefills ${template.name} for ${property.address} before creating a copy.`;
}
