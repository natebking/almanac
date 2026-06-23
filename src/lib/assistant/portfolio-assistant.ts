import { normalizeSearchText } from "@/lib/spreadsheet/property-rows";
import {
  buildHouseProfileItems,
  type HouseProfileSummaryInput,
} from "@/lib/houses/profile-summary";

export type AssistantProperty = {
  id: string;
  address: string;
  currentTenants: string;
  rentAmount: string;
  leaseStart?: string;
  leaseEnd: string;
  tenantPhone: string;
  tenantEmail?: string;
  tenantBirthdays?: string;
  tenantNotes?: string;
  pets?: string;
  owner?: string;
  brokerSplit?: string;
  status: string;
  driveFolderUrl?: string | null;
  profile?: HouseProfileSummaryInput;
};

export type AssistantDriveFile = {
  id: string;
  name: string;
  category: string;
  webViewLink: string;
  propertyIndexId: string | null;
  textExtract?: string;
};

export type AssistantTemplate = {
  id: string;
  name: string;
  description: string;
};

export type AssistantVendorPropertyLink = {
  id: string;
  address: string;
};

export type AssistantVendor = {
  id: string;
  name: string;
  trade: string;
  phone: string;
  email: string;
  notes: string;
  licenseStatus: string;
  insuranceStatus: string;
  propertyLinks: AssistantVendorPropertyLink[];
};

export type AssistantGeneratedDocument = {
  id: string;
  title: string;
  status: string;
  renderedBody: string;
  pdfUrl?: string | null;
  googleDocUrl?: string | null;
  errorMessage?: string | null;
  propertyIndexId?: string | null;
  propertyAddress?: string | null;
  createdAt?: Date | string;
};

export type AssistantInput = {
  today: Date;
  properties: AssistantProperty[];
  driveFiles: AssistantDriveFile[];
  templates?: AssistantTemplate[];
  vendors?: AssistantVendor[];
  generatedDocuments?: AssistantGeneratedDocument[];
};

export type AssistantCitation = {
  label: string;
  href: string;
};

export type AssistantAnswer = {
  answer: string;
  citations: AssistantCitation[];
};

const NOT_FOUND = "I could not find that in the indexed spreadsheet or Drive files.";
const ADDRESS_SUFFIXES = new Set([
  "avenue",
  "ave",
  "boulevard",
  "blvd",
  "circle",
  "cir",
  "court",
  "ct",
  "drive",
  "dr",
  "lane",
  "ln",
  "place",
  "pl",
  "road",
  "rd",
  "street",
  "way",
]);

function citationForProperty(property: AssistantProperty): AssistantCitation {
  return {
    label: `Master spreadsheet row for ${property.address}`,
    href: `/houses/${property.id}`,
  };
}

function findMentionedProperty(question: string, properties: AssistantProperty[]) {
  const normalizedQuestion = normalizeSearchText(question);
  return properties.find((property) =>
    propertyAddressAliases(property.address).some((alias) =>
      normalizedQuestion.includes(alias),
    ),
  );
}

function propertyAddressAliases(address: string): string[] {
  const tokens = normalizeSearchText(address).split(" ").filter(Boolean);
  const aliases = new Set<string>();
  addAddressAlias(aliases, tokens);

  const withoutLeadingNumber =
    tokens.length > 1 && /^\d+$/.test(tokens[0]) ? tokens.slice(1) : tokens;
  addAddressAlias(aliases, withoutLeadingNumber);

  const withoutSuffix =
    withoutLeadingNumber.length > 1 &&
    ADDRESS_SUFFIXES.has(withoutLeadingNumber[withoutLeadingNumber.length - 1])
      ? withoutLeadingNumber.slice(0, -1)
      : withoutLeadingNumber;
  addAddressAlias(aliases, withoutSuffix);

  return [...aliases].sort((a, b) => b.length - a.length);
}

function addAddressAlias(aliases: Set<string>, tokens: string[]) {
  const alias = tokens.join(" ").trim();

  if (alias.length >= 3) {
    aliases.add(alias);
  }
}

function findMentionedTemplate(question: string, templates: AssistantTemplate[]) {
  const normalizedQuestion = normalizeSearchText(question);
  return templates.find((template) =>
    normalizedQuestion.includes(normalizeSearchText(template.name)),
  );
}

function templateHref(template: AssistantTemplate) {
  return `/documents?template=${template.id}`;
}

function citationForTemplate(template: AssistantTemplate): AssistantCitation {
  return {
    label: template.name,
    href: templateHref(template),
  };
}

function findMentionedVendor(question: string, vendors: AssistantVendor[]) {
  const normalizedQuestion = normalizeSearchText(question);

  return vendors.find((vendor) => {
    const vendorName = normalizeSearchText(vendor.name);

    if (normalizedQuestion.includes(vendorName)) {
      return true;
    }

    return vendorName
      .split(" ")
      .filter((token) => token.length > 2)
      .some((token) => normalizedQuestion.includes(token));
  });
}

function findVendorForPropertyTrade(
  normalizedQuestion: string,
  property: AssistantProperty | undefined,
  vendors: AssistantVendor[],
) {
  if (!property) {
    return undefined;
  }

  return vendors.find((vendor) => {
    const linkedToProperty = vendor.propertyLinks.some(
      (link) => link.id === property.id,
    );
    const tradeMentioned = normalizeSearchText(vendor.trade)
      .split(" ")
      .some((token) => token && normalizedQuestion.includes(token));

    return linkedToProperty && tradeMentioned;
  });
}

function citationForVendor(vendor: AssistantVendor): AssistantCitation {
  return {
    label: vendor.name,
    href: `/vendors#${vendor.id}`,
  };
}

function generatedDocumentHref(document: AssistantGeneratedDocument) {
  return `/documents?generated=${document.id}`;
}

function citationForGeneratedDocument(
  document: AssistantGeneratedDocument,
): AssistantCitation {
  return {
    label: document.title,
    href: generatedDocumentHref(document),
  };
}

function filesForProperty(
  property: AssistantProperty,
  files: AssistantDriveFile[],
  category?: string,
) {
  return files.filter((file) => {
    if (file.propertyIndexId !== property.id) {
      return false;
    }

    return !category || file.category === category || normalizeSearchText(file.name).includes(category);
  });
}

function answerWithFiles(files: AssistantDriveFile[], emptyAnswer = NOT_FOUND): AssistantAnswer {
  if (files.length === 0) {
    return { answer: emptyAnswer, citations: [] };
  }

  return {
    answer: `I found ${files.map((file) => file.name).join(", ")}.`,
    citations: files.map((file) => ({ label: file.name, href: file.webViewLink })),
  };
}

function asksForDriveFolder(normalizedQuestion: string) {
  return (
    normalizedQuestion.includes("drive folder") ||
    normalizedQuestion.includes("google drive folder") ||
    normalizedQuestion.includes("property folder")
  );
}

function answerWithDriveFolder(property: AssistantProperty): AssistantAnswer {
  if (!property.driveFolderUrl) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: `I found the Google Drive folder for ${property.address}.`,
    citations: [
      {
        label: `Google Drive folder for ${property.address}`,
        href: property.driveFolderUrl,
      },
    ],
  };
}

function daysUntil(dateText: string, today: Date) {
  if (!dateText) {
    return Number.POSITIVE_INFINITY;
  }

  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function utcCalendarDate(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function parseSpreadsheetDate(dateText: string): Date | null {
  if (!dateText) {
    return null;
  }

  const date = new Date(`${dateText}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSpreadsheetDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysInUtcMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addUtcMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth() + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const day = Math.min(
    date.getUTCDate(),
    daysInUtcMonth(targetYear, targetMonth),
  );

  return new Date(Date.UTC(targetYear, targetMonth, day));
}

function calendarDurationSince(startDate: Date, today: Date) {
  const todayDate = utcCalendarDate(today);
  let months =
    (todayDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    todayDate.getUTCMonth() -
    startDate.getUTCMonth();

  if (todayDate.getUTCDate() < startDate.getUTCDate()) {
    months -= 1;
  }

  const anchorDate = addUtcMonths(startDate, months);
  const days = Math.round(
    (todayDate.getTime() - anchorDate.getTime()) / 86_400_000,
  );

  return { months, days };
}

function pluralize(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function formatCalendarDuration({ months, days }: { months: number; days: number }) {
  if (months === 0) {
    return pluralize(days, "day");
  }

  if (days === 0) {
    return pluralize(months, "month");
  }

  return `${pluralize(months, "month")}, ${pluralize(days, "day")}`;
}

function asksAboutTenantTimeInPlace(normalizedQuestion: string) {
  return (
    normalizedQuestion.includes("tenant") &&
    (normalizedQuestion.includes("how long") ||
      normalizedQuestion.includes("time in place") ||
      normalizedQuestion.includes("been in") ||
      normalizedQuestion.includes("been at"))
  );
}

function tenantTimeInPlaceText(property: AssistantProperty, today: Date) {
  const leaseStart = parseSpreadsheetDate(property.leaseStart ?? "");

  if (!leaseStart) {
    return null;
  }

  const todayDate = utcCalendarDate(today);

  if (leaseStart.getTime() > todayDate.getTime()) {
    const days = Math.ceil(
      (leaseStart.getTime() - todayDate.getTime()) / 86_400_000,
    );

    return `${property.address} - ${property.currentTenants}: starts in ${pluralize(days, "day")} on ${formatSpreadsheetDate(leaseStart)}.`;
  }

  return `${property.address} - ${property.currentTenants}: ${formatCalendarDuration(calendarDurationSince(leaseStart, today))} since ${formatSpreadsheetDate(leaseStart)}.`;
}

function answerTenantTimeInPlace(input: AssistantInput): AssistantAnswer {
  const matches = input.properties.flatMap((property) => {
    if (!property.currentTenants) {
      return [];
    }

    const text = tenantTimeInPlaceText(property, input.today);

    return text ? [{ property, text }] : [];
  });

  if (matches.length === 0) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: [
      `Tenant time in place as of ${formatSpreadsheetDate(utcCalendarDate(input.today))}:`,
      ...matches.map((match) => match.text),
    ].join("\n\n"),
    citations: matches.map(({ property }) => citationForProperty(property)),
  };
}

function asksAboutUpcomingMoveIns(normalizedQuestion: string) {
  return (
    (normalizedQuestion.includes("upcoming") ||
      normalizedQuestion.includes("coming up")) &&
    (normalizedQuestion.includes("move in") ||
      normalizedQuestion.includes("move ins") ||
      normalizedQuestion.includes("movein") ||
      normalizedQuestion.includes("moveins"))
  );
}

function answerUpcomingMoveIns(input: AssistantInput): AssistantAnswer {
  const moveIns = input.properties.filter((property) => {
    const days = daysUntil(property.leaseStart ?? "", input.today);
    return days >= 0 && days <= 30;
  });

  if (moveIns.length === 0) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: `Upcoming move-ins: ${moveIns
      .map((property) => `${property.address} starts on ${property.leaseStart}.`)
      .join(" ")}`,
    citations: moveIns.map(citationForProperty),
  };
}

function asksAboutTenantBirthdaysThisMonth(normalizedQuestion: string) {
  return (
    (normalizedQuestion.includes("birthday") ||
      normalizedQuestion.includes("birthdays")) &&
    normalizedQuestion.includes("month")
  );
}

function monthNames(today: Date) {
  const month = today.getUTCMonth();
  const longNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const shortNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  return {
    longName: longNames[month],
    shortName: shortNames[month],
    monthNumber: month + 1,
  };
}

function splitBirthdayEntries(value: string) {
  return value
    .split(/[;\n|]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function birthdayEntryIsInMonth(entry: string, today: Date) {
  const { longName, shortName, monthNumber } = monthNames(today);
  const normalizedEntry = normalizeSearchText(entry);

  if (
    normalizedEntry.includes(longName) ||
    normalizedEntry.split(" ").includes(shortName)
  ) {
    return true;
  }

  return new RegExp(`(^|[^0-9])0?${monthNumber}([/-]|\\b)`).test(entry);
}

function answerTenantBirthdaysThisMonth(input: AssistantInput): AssistantAnswer {
  const matches = input.properties.flatMap((property) =>
    splitBirthdayEntries(property.tenantBirthdays ?? "")
      .filter((entry) => birthdayEntryIsInMonth(entry, input.today))
      .map((entry) => ({ property, entry })),
  );

  if (matches.length === 0) {
    return { answer: NOT_FOUND, citations: [] };
  }

  const citedProperties = new Map(
    matches.map(({ property }) => [property.id, property]),
  );

  return {
    answer: `Tenant birthdays this month: ${matches
      .map(({ property, entry }) => `${property.address} - ${sentenceValue(entry)}`)
      .join(" ")}`,
    citations: Array.from(citedProperties.values()).map(citationForProperty),
  };
}

function asksAboutTenantNotes(normalizedQuestion: string) {
  return (
    normalizedQuestion.includes("tenant note") ||
    normalizedQuestion.includes("tenant notes") ||
    normalizedQuestion.includes("property note") ||
    normalizedQuestion.includes("property notes")
  );
}

function answerTenantNotes(property: AssistantProperty): AssistantAnswer {
  if (!property.tenantNotes) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: `Tenant notes for ${property.address}: ${sentenceValue(property.tenantNotes)}`,
    citations: [citationForProperty(property)],
  };
}

function normalizedTokens(value: string): Set<string> {
  return new Set(normalizeSearchText(value).split(" ").filter(Boolean));
}

function hasAnyToken(tokens: Set<string>, values: string[]) {
  return values.some((value) => tokens.has(value));
}

function hasHvacTerm(normalizedValue: string) {
  const tokens = normalizedTokens(normalizedValue);

  return (
    tokens.has("ac") ||
    tokens.has("hvac") ||
    /\ba c\b/.test(normalizedValue) ||
    normalizedValue.includes("air conditioner") ||
    normalizedValue.includes("air conditioning")
  );
}

function asksAboutHvacReplacementNeed(normalizedQuestion: string) {
  if (!hasHvacTerm(normalizedQuestion)) {
    return false;
  }

  const tokens = normalizedTokens(normalizedQuestion);
  const hasNeed = hasAnyToken(tokens, ["need", "needed", "needs"]);
  const hasReplacementScope = hasAnyToken(tokens, [
    "new",
    "replace",
    "replaced",
    "replacement",
    "unit",
    "units",
  ]);

  return hasNeed && hasReplacementScope;
}

function isHvacRelatedSourceText(value: string) {
  const normalizedValue = normalizeSearchText(value);

  if (!hasHvacTerm(normalizedValue)) {
    return false;
  }

  const tokens = normalizedTokens(normalizedValue);

  return (
    hasAnyToken(tokens, [
      "conditioner",
      "conditioning",
      "condenser",
      "estimate",
      "estimates",
      "filter",
      "filters",
      "furnace",
      "maintenance",
      "system",
      "systems",
      "unit",
      "units",
      "zone",
      "zones",
    ]) ||
    normalizedValue.includes("hvac warranty") ||
    normalizedValue.includes("warranty covers hvac") ||
    normalizedValue.includes("ac warranty") ||
    normalizedValue.includes("warranty covers ac") ||
    normalizedValue.includes("air conditioner") ||
    normalizedValue.includes("air conditioning")
  );
}

function statesHvacReplacementNeed(value: string) {
  const normalizedValue = normalizeSearchText(value);

  if (!hasHvacTerm(normalizedValue)) {
    return false;
  }

  const tokens = normalizedTokens(normalizedValue);
  const hasReplacement = hasAnyToken(tokens, [
    "new",
    "replace",
    "replaced",
    "replacement",
  ]);
  const hasNeed = hasAnyToken(tokens, ["need", "needed", "needs"]);
  const hasDirective = hasAnyToken(tokens, ["must", "should"]) && tokens.has("replaced");

  return (
    (hasNeed && hasReplacement) ||
    hasDirective ||
    normalizedValue.includes("due for replacement")
  );
}

type HvacEvidence = {
  property: AssistantProperty;
  text: string;
  citation: AssistantCitation;
  statesNeed: boolean;
};

function collectHvacEvidence(input: AssistantInput): HvacEvidence[] {
  const evidence: HvacEvidence[] = [];
  const propertyById = new Map(input.properties.map((property) => [property.id, property]));

  for (const property of input.properties) {
    if (property.tenantNotes && isHvacRelatedSourceText(property.tenantNotes)) {
      evidence.push({
        property,
        text: property.tenantNotes,
        citation: citationForProperty(property),
        statesNeed: statesHvacReplacementNeed(property.tenantNotes),
      });
    }

    const profileItems = buildHouseProfileItems(property.profile ?? null).filter(
      (item) => isHvacRelatedSourceText(item.value),
    );

    if (profileItems.length > 0) {
      const profileText = profileItems.map((item) => item.value).join(" ");
      evidence.push({
        property,
        text: profileText,
        citation: profileCitationForProperty(property),
        statesNeed: statesHvacReplacementNeed(profileText),
      });
    }
  }

  for (const file of input.driveFiles) {
    if (!file.propertyIndexId) {
      continue;
    }

    const property = propertyById.get(file.propertyIndexId);

    if (!property) {
      continue;
    }

    const sourceText = [file.name, file.textExtract ?? ""].join(" ");

    if (!isHvacRelatedSourceText(sourceText)) {
      continue;
    }

    evidence.push({
      property,
      text: file.textExtract?.trim() || file.name,
      citation: { label: file.name, href: file.webViewLink },
      statesNeed: statesHvacReplacementNeed(sourceText),
    });
  }

  return evidence;
}

function uniqueProperties(evidence: HvacEvidence[]) {
  return Array.from(
    new Map(evidence.map((item) => [item.property.id, item.property])).values(),
  );
}

function answerHvacReplacementNeeds(input: AssistantInput): AssistantAnswer {
  const evidence = collectHvacEvidence(input);
  const needsReplacement = evidence.filter((item) => item.statesNeed);

  if (needsReplacement.length > 0) {
    return {
      answer: `Indexed AC/HVAC replacement needs: ${needsReplacement
        .map((item) => `${item.property.address} - ${sentenceValue(item.text)}`)
        .join(" ")}`,
      citations: needsReplacement.map((item) => item.citation),
    };
  }

  const relatedProperties = uniqueProperties(evidence);

  if (relatedProperties.length === 0) {
    return {
      answer:
        "I could not find any indexed source saying a property needs a new AC unit.",
      citations: [],
    };
  }

  return {
    answer: `I could not find any indexed source saying a property needs a new AC unit. Related HVAC/AC records found for ${relatedProperties
      .map((property) => property.address)
      .join(", ")}, but none state a replacement need.`,
    citations: evidence.map((item) => item.citation),
  };
}

function asksAboutDocumentText(question: string): boolean {
  const normalizedQuestion = normalizeSearchText(question);

  return [
    "what does",
    "document say",
    "say about",
    "summarize",
    "summary",
    "notes",
  ].some((phrase) => normalizedQuestion.includes(phrase));
}

const GENERIC_DOCUMENT_TEXT_TOKENS = new Set([
  "about",
  "document",
  "documents",
  "does",
  "file",
  "files",
  "from",
  "says",
  "show",
  "summarize",
  "summary",
  "that",
  "this",
  "what",
  "with",
]);

function documentTextTokens(question: string, property: AssistantProperty): string[] {
  const addressTokens = new Set(normalizeSearchText(property.address).split(" "));

  return normalizeSearchText(question)
    .split(" ")
    .filter(
      (token) =>
        token.length > 3 &&
        !addressTokens.has(token) &&
        !GENERIC_DOCUMENT_TEXT_TOKENS.has(token),
    );
}

function answerWithTextExtract(
  question: string,
  property: AssistantProperty,
  files: AssistantDriveFile[],
): AssistantAnswer {
  const tokens = documentTextTokens(question, property);
  const candidates = files
    .filter((file) => file.propertyIndexId === property.id && file.textExtract)
    .filter((file) => {
      if (tokens.length === 0) {
        return true;
      }

      const normalizedValue = normalizeSearchText(
        [file.name, file.category, file.textExtract ?? ""].join(" "),
      );

      return tokens.some((token) => normalizedValue.includes(token));
    });
  const file = candidates[0];

  if (!file?.textExtract) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: `From ${file.name}: ${file.textExtract}`,
    citations: [{ label: file.name, href: file.webViewLink }],
  };
}

function answerWithFirstTextExtract(
  files: AssistantDriveFile[],
): AssistantAnswer {
  const file = files.find((item) => item.textExtract?.trim());

  if (!file?.textExtract) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: `From ${file.name}: ${file.textExtract.trim()}`,
    citations: [{ label: file.name, href: file.webViewLink }],
  };
}

function asksForFileList(normalizedQuestion: string) {
  return (
    ["find", "list", "open", "show"].some((token) =>
      normalizedQuestion.includes(token),
    ) ||
    normalizedQuestion.includes("file") ||
    normalizedQuestion.includes("files") ||
    normalizedQuestion.includes("document") ||
    normalizedQuestion.includes("documents")
  );
}

function asksForApplicationSummary(normalizedQuestion: string) {
  return (
    normalizedQuestion.includes("application") &&
    (normalizedQuestion.includes("summarize") ||
      normalizedQuestion.includes("summary"))
  );
}

function answerApplicationSummary(
  property: AssistantProperty,
  files: AssistantDriveFile[],
): AssistantAnswer {
  const file = filesForProperty(property, files, "application").find((item) =>
    item.textExtract?.trim(),
  );

  if (!file?.textExtract) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: [
      `Application summary from ${file.name}:`,
      file.textExtract.trim(),
    ].join("\n\n"),
    citations: [{ label: file.name, href: file.webViewLink }],
  };
}

function asksForFinancialFiles(normalizedQuestion: string) {
  return [
    "financial",
    "expense",
    "expenses",
    "owner statement",
    "owner statements",
    "deposited check",
    "deposited checks",
    "commission",
    "commissions",
    "income",
  ].some((phrase) => normalizedQuestion.includes(phrase));
}

function asksAboutTemplateList(normalizedQuestion: string) {
  if (!normalizedQuestion.includes("template")) {
    return false;
  }

  return ["available", "have", "list", "show", "what"].some((token) =>
    normalizedQuestion.includes(token),
  );
}

function answerTemplateList(templates: AssistantTemplate[]): AssistantAnswer {
  if (templates.length === 0) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: `Available templates: ${templates.map((template) => template.name).join(", ")}.`,
    citations: templates.map(citationForTemplate),
  };
}

function answerTemplateLookupIntent(
  normalizedQuestion: string,
  template: AssistantTemplate | undefined,
): AssistantAnswer | null {
  if (
    !template ||
    !["find", "open"].some((token) => normalizedQuestion.includes(token))
  ) {
    return null;
  }

  return {
    answer: `I found ${template.name}.`,
    citations: [citationForTemplate(template)],
  };
}

function asksToGenerateDocument(normalizedQuestion: string): boolean {
  return ["build", "create", "draft", "fill", "generate", "make", "prepare"].some(
    (word) => normalizedQuestion.includes(word),
  );
}

function documentGenerationHref(template: AssistantTemplate, property: AssistantProperty) {
  const params = new URLSearchParams({
    template: template.id,
    property: property.id,
  });

  return `/documents?${params.toString()}`;
}

function answerDocumentGenerationIntent(
  question: string,
  normalizedQuestion: string,
  property: AssistantProperty,
  templates: AssistantTemplate[],
): AssistantAnswer | null {
  if (!asksToGenerateDocument(normalizedQuestion)) {
    return null;
  }

  const template = findMentionedTemplate(question, templates);

  if (!template) {
    return null;
  }

  return {
    answer: `Ready to generate ${template.name} for ${property.address}. Review the fields before creating the document.`,
    citations: [
      {
        label: `Review and generate ${template.name} for ${property.address}`,
        href: documentGenerationHref(template, property),
      },
      citationForProperty(property),
    ],
  };
}

function asksForDraft(normalizedQuestion: string): boolean {
  return ["compose", "create", "draft", "generate", "prepare", "write"].some((token) =>
    normalizedQuestion.includes(token),
  );
}

function answerDraftIntent(
  normalizedQuestion: string,
  property: AssistantProperty,
): AssistantAnswer | null {
  if (!asksForDraft(normalizedQuestion)) {
    return null;
  }

  const tenant = property.currentTenants || "the tenant";
  const owner = property.owner || "Example Property Group";
  const reviewReminder = "Review before sending.";
  const citations = [citationForProperty(property)];

  if (
    normalizedQuestion.includes("tenant text") ||
    normalizedQuestion.includes("tenant message") ||
    normalizedQuestion.includes("text tenant") ||
    normalizedQuestion.includes("message tenant")
  ) {
    return {
      answer: [
        `Draft tenant text for ${property.address}:`,
        `Hi ${tenant}, this is operator with ${owner} about ${property.address}. I wanted to reach out about the property. Please reply when you have a chance.`,
        reviewReminder,
      ].join("\n\n"),
      citations,
    };
  }

  if (
    normalizedQuestion.includes("owner update") ||
    normalizedQuestion.includes("update owner")
  ) {
    const status = property.status || "not listed";
    const tenants = property.currentTenants || "None listed";
    const rent = property.rentAmount || "Not listed";
    const leaseStart = property.leaseStart || "Not listed";
    const leaseEnd = property.leaseEnd || "Not listed";

    return {
      answer: [
        `Draft owner update for ${property.address}:`,
        `${owner} update: ${property.address} is currently ${status}. Tenant(s): ${tenants}. Rent: ${rent}. Lease: ${leaseStart} to ${leaseEnd}.`,
        reviewReminder,
      ].join("\n\n"),
      citations,
    };
  }

  if (
    normalizedQuestion.includes("rent increase notice") ||
    (normalizedQuestion.includes("rent increase") &&
      normalizedQuestion.includes("notice"))
  ) {
    return {
      answer: [
        `Draft rent increase notice for ${property.address}:`,
        `${tenant}, this is a draft rent increase notice for ${property.address}. The current indexed rent is ${property.rentAmount || "not listed"}. Add the new rent amount, effective date, required notice period, and local legal wording before sending.`,
        reviewReminder,
      ].join("\n\n"),
      citations,
    };
  }

  if (normalizedQuestion.includes("notice")) {
    const noticeWindow = normalizedQuestion.includes("48 hour")
      ? "48-hour"
      : "property";

    return {
      answer: [
        `Draft ${noticeWindow} notice for ${property.address}:`,
        `${tenant}, this is a draft notice that Example Property Group intends to enter ${property.address} after at least 48 hours' notice. Confirm the date, time, reason for entry, and local legal wording before sending.`,
        reviewReminder,
      ].join("\n\n"),
      citations,
    };
  }

  return null;
}

function asksAboutGeneratedDocuments(normalizedQuestion: string) {
  return (
    normalizedQuestion.includes("generated") ||
    normalizedQuestion.includes("generated document") ||
    normalizedQuestion.includes("generated documents") ||
    normalizedQuestion.includes("generated copy") ||
    normalizedQuestion.includes("generated copies") ||
    normalizedQuestion.includes("already generated") ||
    normalizedQuestion.includes("created document") ||
    normalizedQuestion.includes("created copy") ||
    normalizedQuestion.includes("previous document") ||
    normalizedQuestion.includes("recent document") ||
    normalizedQuestion.includes("printable")
  );
}

const GENERATED_DOCUMENT_QUERY_TOKENS = new Set([
  "already",
  "copy",
  "created",
  "document",
  "documents",
  "find",
  "for",
  "generated",
  "history",
  "open",
  "previous",
  "print",
  "printable",
  "recent",
  "review",
  "show",
  "the",
]);

function generatedDocumentTokens(
  question: string,
  property: AssistantProperty | undefined,
) {
  const addressTokens = new Set(
    property ? normalizeSearchText(property.address).split(" ") : [],
  );

  return normalizeSearchText(question)
    .split(" ")
    .filter(
      (token) =>
        token.length > 2 &&
        !addressTokens.has(token) &&
        !GENERATED_DOCUMENT_QUERY_TOKENS.has(token),
    );
}

function generatedDocumentMatchesProperty(
  document: AssistantGeneratedDocument,
  property: AssistantProperty | undefined,
) {
  if (!property) {
    return true;
  }

  const normalizedAddress = normalizeSearchText(property.address);

  return (
    document.propertyIndexId === property.id ||
    normalizeSearchText(document.propertyAddress ?? "") === normalizedAddress ||
    normalizeSearchText(document.title).includes(normalizedAddress)
  );
}

function generatedDocumentMatchesTokens(
  document: AssistantGeneratedDocument,
  tokens: string[],
) {
  if (tokens.length === 0) {
    return true;
  }

  const haystack = normalizeSearchText(
    [
      document.title,
      document.status,
      document.renderedBody,
      document.propertyAddress ?? "",
    ].join(" "),
  );

  return tokens.every((token) => haystack.includes(token));
}

function generatedDocumentActionIntent(normalizedQuestion: string) {
  return ["find", "open", "print", "review"].some((token) =>
    normalizedQuestion.includes(token),
  );
}

function answerGeneratedDocumentsIntent(
  question: string,
  normalizedQuestion: string,
  property: AssistantProperty | undefined,
  documents: AssistantGeneratedDocument[],
): AssistantAnswer | null {
  if (!asksAboutGeneratedDocuments(normalizedQuestion)) {
    return null;
  }

  const tokens = generatedDocumentTokens(question, property);
  const matches = documents
    .filter((document) => generatedDocumentMatchesProperty(document, property))
    .filter((document) => generatedDocumentMatchesTokens(document, tokens));

  if (matches.length === 0) {
    return { answer: NOT_FOUND, citations: [] };
  }

  if (matches.length === 1 && generatedDocumentActionIntent(normalizedQuestion)) {
    const [document] = matches;

    return {
      answer: `I found ${document.title}. Review or print it from Documents.`,
      citations: [citationForGeneratedDocument(document)],
    };
  }

  const scope = property ? property.address : "the portfolio";

  return {
    answer: `Generated documents for ${scope}: ${matches
      .map((document) => `${document.title} (${document.status})`)
      .join(", ")}.`,
    citations: matches.map(citationForGeneratedDocument),
  };
}

function profileCitationForProperty(property: AssistantProperty): AssistantCitation {
  return {
    label: `Property profile for ${property.address}`,
    href: `/houses/${property.id}`,
  };
}

function answerPropertyProfileQuestion(
  normalizedQuestion: string,
  property: AssistantProperty,
): AssistantAnswer | null {
  const profileItems = buildHouseProfileItems(property.profile ?? null);
  const item = profileItems.find((profileItem) =>
    matchesProfileIntent(normalizedQuestion, profileItem.label),
  );

  if (!item) {
    return null;
  }

  return {
    answer: `${item.label} for ${property.address}: ${sentenceValue(item.value)}`,
    citations: [profileCitationForProperty(property)],
  };
}

function matchesProfileIntent(normalizedQuestion: string, label: string) {
  if (label === "Codes") {
    return ["access", "code", "gate", "garage", "lockbox"].some((token) =>
      normalizedQuestion.includes(token),
    );
  }

  if (label === "Filter size") {
    return normalizedQuestion.includes("filter");
  }

  if (label === "Appliances") {
    return [
      "appliance",
      "dishwasher",
      "dryer",
      "fridge",
      "garage opener",
      "refrigerator",
      "washer",
      "water heater",
    ].some((token) => normalizedQuestion.includes(token));
  }

  if (label === "Home warranty") {
    return normalizedQuestion.includes("warranty");
  }

  if (label === "HOA") {
    return normalizedQuestion.includes("hoa");
  }

  if (label === "Utilities") {
    return ["electric", "gas", "internet", "trash", "utilities", "utility", "water"].some(
      (token) => normalizedQuestion.includes(token),
    );
  }

  return false;
}

function sentenceValue(value: string) {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function articleForTrade(trade: string) {
  const normalizedTrade = normalizeSearchText(trade);

  return /^[aeiou]/.test(normalizedTrade) || normalizedTrade.startsWith("hvac")
    ? "an"
    : "a";
}

function vendorLinkedProperties(vendor: AssistantVendor) {
  return vendor.propertyLinks.map((property) => property.address).filter(Boolean);
}

function answerVendorIntent(
  normalizedQuestion: string,
  vendor: AssistantVendor,
  driveFiles: AssistantDriveFile[],
): AssistantAnswer {
  const linkedProperties = vendorLinkedProperties(vendor);
  const linkedPropertiesText = linkedProperties.length
    ? linkedProperties.join(", ")
    : "None linked";

  if (normalizedQuestion.includes("phone") || normalizedQuestion.includes("call")) {
    if (!vendor.phone) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `The phone number for ${vendor.name} is ${vendor.phone}.`,
      citations: [citationForVendor(vendor)],
    };
  }

  if (normalizedQuestion.includes("email")) {
    if (!vendor.email) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `The email for ${vendor.name} is ${vendor.email}.`,
      citations: [citationForVendor(vendor)],
    };
  }

  if (
    normalizedQuestion.includes("property") ||
    normalizedQuestion.includes("properties") ||
    normalizedQuestion.includes("worked on") ||
    normalizedQuestion.includes("works on")
  ) {
    if (linkedProperties.length === 0) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `${vendor.name} is linked to ${linkedPropertiesText}.`,
      citations: [citationForVendor(vendor)],
    };
  }

  const workHistoryAnswer = answerVendorWorkHistory(
    normalizedQuestion,
    vendor,
    driveFiles,
  );

  if (workHistoryAnswer) {
    return workHistoryAnswer;
  }

  return {
    answer: [
      `${vendor.name} is ${articleForTrade(vendor.trade)} ${vendor.trade} vendor.`,
      vendor.phone ? `Phone: ${vendor.phone}.` : "",
      vendor.email ? `Email: ${vendor.email}.` : "",
      vendor.notes ? `Notes: ${sentenceValue(vendor.notes)}` : "",
      vendor.licenseStatus ? `License: ${sentenceValue(vendor.licenseStatus)}` : "",
      vendor.insuranceStatus
        ? `Insurance: ${sentenceValue(vendor.insuranceStatus)}`
        : "",
      `Linked properties: ${linkedPropertiesText}.`,
    ]
      .filter(Boolean)
      .join(" "),
    citations: [citationForVendor(vendor)],
  };
}

function asksAboutVendorWorkHistory(normalizedQuestion: string): boolean {
  return [
    "completed",
    "done",
    "invoice",
    "invoices",
    "job",
    "jobs",
    "maintenance",
    "repair",
    "repairs",
    "work",
  ].some((token) => normalizedQuestion.includes(token));
}

function answerVendorWorkHistory(
  normalizedQuestion: string,
  vendor: AssistantVendor,
  driveFiles: AssistantDriveFile[],
): AssistantAnswer | null {
  if (!asksAboutVendorWorkHistory(normalizedQuestion)) {
    return null;
  }

  const matches = driveFiles.filter((file) => driveFileMentionsVendor(file, vendor));

  if (matches.length === 0) {
    return { answer: NOT_FOUND, citations: [] };
  }

  return {
    answer: `Indexed work for ${vendor.name}: ${matches
      .map((file) => file.name)
      .join(", ")}.`,
    citations: matches.map((file) => ({ label: file.name, href: file.webViewLink })),
  };
}

function driveFileMentionsVendor(
  file: AssistantDriveFile,
  vendor: AssistantVendor,
): boolean {
  const sourceText = normalizeSearchText(
    [file.name, file.category, file.textExtract ?? ""].join(" "),
  );
  const vendorName = normalizeSearchText(vendor.name);

  if (sourceText.includes(vendorName)) {
    return true;
  }

  const vendorTokens = vendorName
    .split(" ")
    .filter((token) => token.length > 2);

  return (
    vendorTokens.length > 0 &&
    vendorTokens.every((token) => sourceText.includes(token))
  );
}

export function answerPortfolioQuestion(
  question: string,
  input: AssistantInput,
): AssistantAnswer {
  const normalizedQuestion = normalizeSearchText(question);
  const property = findMentionedProperty(question, input.properties);
  const templates = input.templates ?? [];
  const mentionedTemplate = findMentionedTemplate(question, templates);
  const vendors = input.vendors ?? [];
  const generatedDocuments = input.generatedDocuments ?? [];
  const mentionedVendor =
    findVendorForPropertyTrade(normalizedQuestion, property, vendors) ??
    findMentionedVendor(question, vendors);

  if (normalizedQuestion.includes("vacant")) {
    const vacant = input.properties.filter((item) =>
      normalizeSearchText(item.status).includes("vacant"),
    );

    if (vacant.length === 0) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `Vacant properties: ${vacant.map((item) => item.address).join(", ")}.`,
      citations: vacant.map(citationForProperty),
    };
  }

  if (normalizedQuestion.includes("project") && (normalizedQuestion.includes("active") || normalizedQuestion.includes("current"))) {
    return answerWithFiles(input.driveFiles.filter((file) => file.category === "project"));
  }

  if (normalizedQuestion.includes("leases expire within 90 days")) {
    const expiring = input.properties.filter((item) => {
      const days = daysUntil(item.leaseEnd, input.today);
      return days >= 0 && days <= 90;
    });

    if (expiring.length === 0) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: expiring
        .map((item) => `${item.address} expires on ${item.leaseEnd}.`)
        .join(" "),
      citations: expiring.map(citationForProperty),
    };
  }

  if (asksAboutUpcomingMoveIns(normalizedQuestion)) {
    return answerUpcomingMoveIns(input);
  }

  if (asksAboutTenantBirthdaysThisMonth(normalizedQuestion)) {
    return answerTenantBirthdaysThisMonth(input);
  }

  if (asksAboutTenantTimeInPlace(normalizedQuestion)) {
    return answerTenantTimeInPlace(input);
  }

  if (mentionedVendor) {
    return answerVendorIntent(
      normalizedQuestion,
      mentionedVendor,
      input.driveFiles,
    );
  }

  if (!mentionedTemplate && asksAboutTemplateList(normalizedQuestion)) {
    return answerTemplateList(templates);
  }

  const generatedDocumentAnswer = answerGeneratedDocumentsIntent(
    question,
    normalizedQuestion,
    property,
    generatedDocuments,
  );

  if (generatedDocumentAnswer) {
    return generatedDocumentAnswer;
  }

  if (asksAboutHvacReplacementNeed(normalizedQuestion)) {
    return answerHvacReplacementNeeds(input);
  }

  if (normalizedQuestion.includes("find") || normalizedQuestion.includes("open")) {
    const file = input.driveFiles.find((item) =>
      normalizeSearchText(question).includes(normalizeSearchText(item.name)),
    );

    if (file) {
      return {
        answer: `I found ${file.name}.`,
        citations: [{ label: file.name, href: file.webViewLink }],
      };
    }
  }

  const templateLookupAnswer = answerTemplateLookupIntent(
    normalizedQuestion,
    mentionedTemplate,
  );

  if (templateLookupAnswer) {
    return templateLookupAnswer;
  }

  if (!property) {
    return { answer: NOT_FOUND, citations: [] };
  }

  if (asksForDriveFolder(normalizedQuestion)) {
    return answerWithDriveFolder(property);
  }

  const documentGenerationAnswer = answerDocumentGenerationIntent(
    question,
    normalizedQuestion,
    property,
    templates,
  );

  if (documentGenerationAnswer) {
    return documentGenerationAnswer;
  }

  const draftAnswer = answerDraftIntent(normalizedQuestion, property);

  if (draftAnswer) {
    return draftAnswer;
  }

  if (asksForApplicationSummary(normalizedQuestion)) {
    return answerApplicationSummary(property, input.driveFiles);
  }

  if (asksAboutTenantNotes(normalizedQuestion)) {
    return answerTenantNotes(property);
  }

  if (asksAboutDocumentText(question)) {
    return answerWithTextExtract(question, property, input.driveFiles);
  }

  if (asksForFinancialFiles(normalizedQuestion)) {
    return answerWithFiles(filesForProperty(property, input.driveFiles, "financial"));
  }

  const propertyProfileAnswer = answerPropertyProfileQuestion(
    normalizedQuestion,
    property,
  );

  if (propertyProfileAnswer) {
    return propertyProfileAnswer;
  }

  if (
    normalizedQuestion.includes("every document") ||
    normalizedQuestion.includes("documents for") ||
    normalizedQuestion.includes("show me")
  ) {
    return answerWithFiles(filesForProperty(property, input.driveFiles));
  }

  if (normalizedQuestion.includes("open") || normalizedQuestion.includes("find")) {
    if (normalizedQuestion.includes("lease")) {
      return answerWithFiles(filesForProperty(property, input.driveFiles, "lease"));
    }

    if (normalizedQuestion.includes("application")) {
      return answerWithFiles(filesForProperty(property, input.driveFiles, "application"));
    }

    if (normalizedQuestion.includes("photo")) {
      return answerWithFiles(filesForProperty(property, input.driveFiles, "photos"));
    }
  }

  if (normalizedQuestion.includes("maintenance")) {
    const maintenanceFiles = filesForProperty(
      property,
      input.driveFiles,
      "maintenance",
    );

    return asksForFileList(normalizedQuestion)
      ? answerWithFiles(maintenanceFiles)
      : answerWithFirstTextExtract(maintenanceFiles);
  }

  if (normalizedQuestion.includes("who lives")) {
    if (!property.currentTenants) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `${property.currentTenants} lives at ${property.address}.`,
      citations: [citationForProperty(property)],
    };
  }

  if (normalizedQuestion.includes("rent")) {
    if (!property.rentAmount) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `The rent at ${property.address} is ${property.rentAmount}.`,
      citations: [citationForProperty(property)],
    };
  }

  if (normalizedQuestion.includes("lease expire")) {
    if (!property.leaseEnd) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `The lease at ${property.address} expires on ${property.leaseEnd}.`,
      citations: [citationForProperty(property)],
    };
  }

  if (normalizedQuestion.includes("phone")) {
    if (!property.tenantPhone) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `The tenant phone number for ${property.address} is ${property.tenantPhone}.`,
      citations: [citationForProperty(property)],
    };
  }

  if (normalizedQuestion.includes("email")) {
    if (!property.tenantEmail) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `The tenant email for ${property.address} is ${property.tenantEmail}.`,
      citations: [citationForProperty(property)],
    };
  }

  if (normalizedQuestion.includes("pet")) {
    if (!property.pets) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `Pets for ${property.address}: ${sentenceValue(property.pets)}`,
      citations: [citationForProperty(property)],
    };
  }

  if (normalizedQuestion.includes("owner") || normalizedQuestion.includes("owns")) {
    if (!property.owner) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `The owner for ${property.address} is ${sentenceValue(property.owner)}`,
      citations: [citationForProperty(property)],
    };
  }

  if (normalizedQuestion.includes("broker split") || normalizedQuestion.includes("split")) {
    if (!property.brokerSplit) {
      return { answer: NOT_FOUND, citations: [] };
    }

    return {
      answer: `The broker split for ${property.address} is ${sentenceValue(property.brokerSplit)}`,
      citations: [citationForProperty(property)],
    };
  }

  return { answer: NOT_FOUND, citations: [] };
}
