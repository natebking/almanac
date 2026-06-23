import { normalizeSearchText } from "@/lib/spreadsheet/property-rows";
import {
  answerPortfolioQuestion,
  type AssistantAnswer,
  type AssistantDriveFile,
  type AssistantGeneratedDocument,
  type AssistantInput,
  type AssistantProperty,
  type AssistantVendor,
} from "@/lib/assistant/portfolio-assistant";
import { formatGeneratedDocumentError } from "@/lib/documents/errors";
import { buildHouseProfileItems } from "@/lib/houses/profile-summary";

export type AssistantGroundingFact = {
  label: string;
  href: string;
  text: string;
};

export type AssistantGrounding = {
  question: string;
  facts: AssistantGroundingFact[];
};

export type GroundedAssistantProviderInput = {
  question: string;
  fallbackAnswer: AssistantAnswer;
  grounding: AssistantGrounding;
};

export type GroundedAssistantProvider = (
  input: GroundedAssistantProviderInput,
) => Promise<AssistantAnswer | null>;

export function buildAssistantGrounding(
  question: string,
  input: AssistantInput,
): AssistantGrounding {
  const normalizedQuestion = normalizeSearchText(question);
  const mentionedProperty = input.properties.find((property) =>
    normalizedQuestion.includes(normalizeSearchText(property.address)),
  );
  const properties = mentionedProperty ? [mentionedProperty] : input.properties;
  const propertyIds = new Set(properties.map((property) => property.id));
  const files = input.driveFiles.filter((file) => {
    if (!file.propertyIndexId) {
      return normalizedQuestion.includes(normalizeSearchText(file.name));
    }

    return propertyIds.has(file.propertyIndexId);
  });
  const vendors = (input.vendors ?? []).filter((vendor) =>
    vendorMatchesGrounding(vendor, normalizedQuestion, propertyIds),
  );
  const generatedDocuments = (input.generatedDocuments ?? []).filter((document) =>
    generatedDocumentMatchesGrounding(document, normalizedQuestion, propertyIds),
  );

  return {
    question: question.trim(),
    facts: [
      ...properties.map(propertyGroundingFact),
      ...properties.flatMap(propertyProfileGroundingFact),
      ...properties.flatMap(propertyDriveFolderGroundingFact),
      ...vendors.map(vendorGroundingFact),
      ...generatedDocuments.map(generatedDocumentGroundingFact),
      ...files.map(driveFileGroundingFact),
    ],
  };
}

export async function answerGroundedPortfolioQuestion(input: {
  question: string;
  input: AssistantInput;
  provider?: GroundedAssistantProvider;
}): Promise<AssistantAnswer> {
  const fallbackAnswer = answerPortfolioQuestion(input.question, input.input);
  const grounding = buildAssistantGrounding(input.question, input.input);

  if (!input.provider || hasDocumentGenerationAction(fallbackAnswer)) {
    return fallbackAnswer;
  }

  try {
    const providerAnswer = await input.provider({
      question: input.question.trim(),
      fallbackAnswer,
      grounding,
    });

    return safeProviderAnswer(providerAnswer, fallbackAnswer, grounding);
  } catch {
    return fallbackAnswer;
  }
}

function hasDocumentGenerationAction(answer: AssistantAnswer): boolean {
  return answer.citations.some((citation) => citation.href.startsWith("/documents?"));
}

function propertyGroundingFact(property: AssistantProperty): AssistantGroundingFact {
  return {
    label: `Master spreadsheet row for ${property.address}`,
    href: `/houses/${property.id}`,
    text: [
      `Property: ${property.address}`,
      `Tenant(s): ${property.currentTenants || "None listed"}`,
      `Rent: ${property.rentAmount || "Not listed"}`,
      `Lease start: ${property.leaseStart || "Not listed"}`,
      `Lease end: ${property.leaseEnd || "Not listed"}`,
      `Tenant phone: ${property.tenantPhone || "Not listed"}`,
      `Tenant email: ${property.tenantEmail || "Not listed"}`,
      `Tenant birthday(s): ${property.tenantBirthdays || "Not listed"}`,
      `Tenant notes: ${property.tenantNotes || "Not listed"}`,
      `Pets: ${property.pets || "Not listed"}`,
      `Owner: ${property.owner || "Not listed"}`,
      `Broker split: ${property.brokerSplit || "Not listed"}`,
      `Status: ${property.status || "Not listed"}`,
    ].join("\n"),
  };
}

function propertyProfileGroundingFact(
  property: AssistantProperty,
): AssistantGroundingFact[] {
  const profileItems = buildHouseProfileItems(property.profile ?? null);

  if (profileItems.length === 0) {
    return [];
  }

  return [
    {
      label: `Property profile for ${property.address}`,
      href: `/houses/${property.id}`,
      text: profileItems
        .map((item) => `${item.label}: ${item.value}`)
        .join("\n"),
    },
  ];
}

function propertyDriveFolderGroundingFact(
  property: AssistantProperty,
): AssistantGroundingFact[] {
  if (!property.driveFolderUrl) {
    return [];
  }

  return [
    {
      label: `Google Drive folder for ${property.address}`,
      href: property.driveFolderUrl,
      text: `Google Drive folder for ${property.address}.`,
    },
  ];
}

function driveFileGroundingFact(file: AssistantDriveFile): AssistantGroundingFact {
  return {
    label: file.name,
    href: file.webViewLink,
    text: [
      `Drive file: ${file.name}`,
      `Category: ${file.category}`,
      file.textExtract ? `Extract: ${file.textExtract}` : "Extract: Not indexed",
    ].join("\n"),
  };
}

function vendorMatchesGrounding(
  vendor: AssistantVendor,
  normalizedQuestion: string,
  propertyIds: Set<string>,
) {
  const vendorNameTokens = normalizeSearchText(vendor.name)
    .split(" ")
    .filter((token) => token.length > 2);
  const directVendorMention = vendorNameTokens.some((token) =>
    normalizedQuestion.includes(token),
  );
  const tradeMentioned = normalizeSearchText(vendor.trade)
    .split(" ")
    .filter(Boolean)
    .some((token) => normalizedQuestion.includes(token));
  const linkedToMentionedProperty = vendor.propertyLinks.some((property) =>
    propertyIds.has(property.id),
  );

  return directVendorMention || (tradeMentioned && linkedToMentionedProperty);
}

function vendorGroundingFact(vendor: AssistantVendor): AssistantGroundingFact {
  const linkedProperties =
    vendor.propertyLinks.map((property) => property.address).join(", ") ||
    "None linked";

  return {
    label: `Vendor directory entry for ${vendor.name}`,
    href: `/vendors#${vendor.id}`,
    text: [
      `Vendor: ${vendor.name}`,
      `Trade: ${vendor.trade || "Not listed"}`,
      `Phone: ${vendor.phone || "Not listed"}`,
      `Email: ${vendor.email || "Not listed"}`,
      `Notes: ${vendor.notes || "Not listed"}`,
      `License: ${vendor.licenseStatus || "Not listed"}`,
      `Insurance: ${vendor.insuranceStatus || "Not listed"}`,
      `Linked properties: ${linkedProperties}`,
    ].join("\n"),
  };
}

function generatedDocumentMatchesGrounding(
  document: AssistantGeneratedDocument,
  normalizedQuestion: string,
  propertyIds: Set<string>,
) {
  const generatedIntent =
    normalizedQuestion.includes("generated") ||
    normalizedQuestion.includes("printable") ||
    normalizedQuestion.includes("created document") ||
    normalizedQuestion.includes("created copy");
  const linkedToMentionedProperty = Boolean(
    document.propertyIndexId && propertyIds.has(document.propertyIndexId),
  );
  const matchingTitleTokens = normalizeSearchText(document.title)
    .split(" ")
    .filter((token) => token.length > 2)
    .filter((token) => normalizedQuestion.includes(token));

  return (
    (generatedIntent && linkedToMentionedProperty) ||
    matchingTitleTokens.length >= 2
  );
}

function generatedDocumentGroundingFact(
  document: AssistantGeneratedDocument,
): AssistantGroundingFact {
  const errorMessage = formatGeneratedDocumentError(document.errorMessage);

  return {
    label: `Generated document record for ${document.title}`,
    href: `/documents?generated=${document.id}`,
    text: [
      `Generated document: ${document.title}`,
      `Property: ${document.propertyAddress || "Not linked"}`,
      `Status: ${document.status}`,
      document.pdfUrl ? `PDF URL: ${document.pdfUrl}` : "PDF URL: Not available",
      document.googleDocUrl
        ? `Google Doc URL: ${document.googleDocUrl}`
        : "Google Doc URL: Not available",
      errorMessage ? `Error: ${errorMessage}` : "Error: None recorded",
      `Body: ${document.renderedBody}`,
    ].join("\n"),
  };
}

function safeProviderAnswer(
  providerAnswer: AssistantAnswer | null,
  fallbackAnswer: AssistantAnswer,
  grounding: AssistantGrounding,
): AssistantAnswer {
  if (!providerAnswer?.answer.trim()) {
    return fallbackAnswer;
  }

  if (providerAnswer.citations.length === 0) {
    return fallbackAnswer;
  }

  const citationByHref = new Map(grounding.facts.map((fact) => [fact.href, fact]));
  const citations: AssistantGroundingFact[] = [];

  for (const citation of providerAnswer.citations) {
    const groundedCitation = citationByHref.get(citation.href);

    if (!groundedCitation) {
      return fallbackAnswer;
    }

    citations.push(groundedCitation);
  }

  return {
    answer: providerAnswer.answer.trim(),
    citations: citations.map((citation) => ({
      label: citation.label,
      href: citation.href,
    })),
  };
}
