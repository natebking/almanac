import { normalizeSearchText } from "@/lib/spreadsheet/property-rows";

export type SearchableProperty = {
  id: string;
  address: string;
  currentTenants: string;
  rentAmount?: string;
  leaseEnd?: string;
  tenantBirthdays?: string;
  status?: string;
  driveFolderUrl?: string | null;
  profileText?: string;
};

export type SearchableDriveFile = {
  id: string;
  name: string;
  category: string;
  webViewLink: string;
  propertyIndexId: string | null;
  textExtract?: string;
};

export type SearchableVendor = {
  id: string;
  name: string;
  trade: string;
  notes: string;
  propertyNames?: string[];
};

export type SearchableTemplate = {
  id: string;
  name: string;
  description: string;
};

export type SearchableGeneratedDocument = {
  id: string;
  title: string;
  renderedBody: string;
};

export type PortfolioSearchInput = {
  properties: SearchableProperty[];
  driveFiles: SearchableDriveFile[];
  vendors: SearchableVendor[];
  templates: SearchableTemplate[];
  generatedDocuments: SearchableGeneratedDocument[];
};

export type PortfolioSearchResult = {
  type:
    | "property"
    | "drive-folder"
    | "drive-file"
    | "vendor"
    | "template"
    | "generated-document";
  title: string;
  subtitle: string;
  href: string;
  source: string;
  actions: PortfolioSearchAction[];
};

export type PortfolioSearchAction = {
  label: string;
  href: string;
  target?: "_blank";
};

export type PortfolioSearchResultGroup = {
  type: PortfolioSearchResult["type"];
  label: string;
  results: PortfolioSearchResult[];
};

const SEARCH_RESULT_GROUPS: Array<{
  type: PortfolioSearchResult["type"];
  label: string;
}> = [
  { type: "property", label: "Properties" },
  { type: "drive-folder", label: "Drive folders" },
  { type: "drive-file", label: "Drive files" },
  { type: "vendor", label: "Vendors" },
  { type: "template", label: "Templates" },
  { type: "generated-document", label: "Generated documents" },
];

function matches(query: string, ...values: string[]) {
  const normalizedValues = normalizeSearchText(values.join(" "));
  return normalizeSearchText(query)
    .split(" ")
    .filter(Boolean)
    .every((token) => normalizedValues.includes(token));
}

function snippet(value: string, maxLength = 90) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

export function searchPortfolio(
  query: string,
  input: PortfolioSearchInput,
): PortfolioSearchResult[] {
  if (normalizeSearchText(query) === "") {
    return [];
  }

  const results: PortfolioSearchResult[] = [];

  for (const property of input.properties) {
    if (
      matches(
        query,
        property.address,
        property.currentTenants,
        property.rentAmount ?? "",
        property.leaseEnd ?? "",
        property.tenantBirthdays
          ? `tenant birthday birthdays ${property.tenantBirthdays}`
          : "",
        property.status ?? "",
        property.profileText ?? "",
      )
    ) {
      results.push({
        type: "property",
        title: property.address,
        subtitle: property.currentTenants || property.status || "Property",
        href: `/houses/${property.id}`,
        source: "Master spreadsheet",
        actions: [
          { label: "Open house", href: `/houses/${property.id}` },
          ...externalAction("Drive folder", property.driveFolderUrl),
        ],
      });

      if (property.driveFolderUrl && matchesDriveFolderIntent(query, property)) {
        results.push({
          type: "drive-folder",
          title: `${property.address} Drive folder`,
          subtitle: "Google Drive folder",
          href: property.driveFolderUrl,
          source: "Google Drive",
          actions: [
            { label: "Open folder", href: property.driveFolderUrl, target: "_blank" },
            { label: "Open house", href: `/houses/${property.id}` },
          ],
        });
      }
    }
  }

  for (const file of input.driveFiles) {
    if (matches(query, file.name, file.category, file.textExtract ?? "")) {
      results.push({
        type: "drive-file",
        title: file.name,
        subtitle: file.textExtract ? snippet(file.textExtract) : file.category,
        href: file.webViewLink,
        source: "Google Drive index",
        actions: [
          { label: "Open file", href: file.webViewLink, target: "_blank" },
          ...internalAction("Open house", file.propertyIndexId ? `/houses/${file.propertyIndexId}` : null),
        ],
      });
    }
  }

  for (const vendor of input.vendors) {
    if (
      matches(
        query,
        vendor.name,
        vendor.trade,
        vendor.notes,
        ...(vendor.propertyNames ?? []),
      )
    ) {
      const propertyText =
        vendor.propertyNames && vendor.propertyNames.length > 0
          ? ` - ${vendor.propertyNames.join(", ")}`
          : "";
      results.push({
        type: "vendor",
        title: vendor.name,
        subtitle: `${vendor.trade}${propertyText}`,
        href: `/vendors#${vendor.id}`,
        source: "Vendor directory",
        actions: [{ label: "Open vendor", href: `/vendors#${vendor.id}` }],
      });
    }
  }

  for (const template of input.templates) {
    if (matches(query, template.name, template.description)) {
      results.push({
        type: "template",
        title: template.name,
        subtitle: template.description,
        href: `/documents?template=${template.id}`,
        source: "Template index",
        actions: [{ label: "Generate", href: `/documents?template=${template.id}` }],
      });
    }
  }

  for (const document of input.generatedDocuments) {
    if (matches(query, document.title, document.renderedBody)) {
      results.push({
        type: "generated-document",
        title: document.title,
        subtitle: "Generated document",
        href: `/documents?generated=${document.id}`,
        source: "Generated document history",
        actions: [
          { label: "Review", href: `/documents?generated=${document.id}` },
        ],
      });
    }
  }

  return results;
}

export function groupPortfolioSearchResults(
  results: PortfolioSearchResult[],
): PortfolioSearchResultGroup[] {
  return SEARCH_RESULT_GROUPS.flatMap((group) => {
    const groupResults = results.filter((result) => result.type === group.type);

    if (groupResults.length === 0) {
      return [];
    }

    return [
      {
        type: group.type,
        label: group.label,
        results: groupResults,
      },
    ];
  });
}

function matchesDriveFolderIntent(query: string, property: SearchableProperty) {
  return matches(query, property.address, property.currentTenants, "drive folder google folder");
}

function externalAction(
  label: string,
  href: string | null | undefined,
): PortfolioSearchAction[] {
  return href ? [{ label, href, target: "_blank" }] : [];
}

function internalAction(
  label: string,
  href: string | null | undefined,
): PortfolioSearchAction[] {
  return href ? [{ label, href }] : [];
}
