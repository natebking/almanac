import type { Property, PropertyIndex, PropertyProfile } from "@/generated/prisma/client";

export type FieldValues = Record<string, string>;

type IndexedPropertyProfileDefaults = Pick<
  PropertyProfile,
  | "accessCodes"
  | "applianceInfo"
  | "filterSize"
  | "hoaInfo"
  | "homeWarranty"
  | "utilityProviders"
>;

export type IndexedDocumentPropertySource = PropertyIndex & {
  profile?: IndexedPropertyProfileDefaults | null;
};

export type DocumentPropertySource = Property | IndexedDocumentPropertySource;

const LOCAL_PROPERTY_VALUE_MAP: Record<string, keyof Property> = {
  access_codes: "accessCodes",
  appliance_notes: "applianceNotes",
  filter_size: "filterSize",
  hoa_notes: "hoaNotes",
  owner_name: "ownerName",
  property_address: "address",
  tenant_name: "tenantName",
  utility_notes: "utilityNotes",
  warranty_notes: "warrantyNotes",
};

const INDEXED_PROPERTY_VALUE_MAP: Record<string, keyof PropertyIndex> = {
  broker_split: "brokerSplit",
  lease_end: "leaseEnd",
  lease_start: "leaseStart",
  move_in_date: "leaseStart",
  owner_name: "owner",
  pets: "pets",
  property_address: "address",
  rent_amount: "rentAmount",
  tenant_email: "tenantEmail",
  tenant_birthdays: "tenantBirthdays",
  tenant_name: "currentTenants",
  tenant_notes: "tenantNotes",
  tenant_phone: "tenantPhone",
};

const INDEXED_PROFILE_VALUE_MAP: Record<
  string,
  keyof IndexedPropertyProfileDefaults
> = {
  access_codes: "accessCodes",
  appliance_info: "applianceInfo",
  appliance_notes: "applianceInfo",
  filter_size: "filterSize",
  hoa_info: "hoaInfo",
  hoa_notes: "hoaInfo",
  home_warranty: "homeWarranty",
  utility_notes: "utilityProviders",
  utility_providers: "utilityProviders",
  warranty_notes: "homeWarranty",
};

export function parseTemplatePlaceholders(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function humanizePlaceholder(key: string): string {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function propertyPlaceholderDefaults(
  property: DocumentPropertySource,
): FieldValues {
  if (isIndexedProperty(property)) {
    const rowDefaults = Object.fromEntries(
      Object.entries(INDEXED_PROPERTY_VALUE_MAP).map(([key, propertyKey]) => [
        key,
        String(property[propertyKey] ?? ""),
      ]),
    );

    return {
      ...rowDefaults,
      ...profilePlaceholderDefaults(property.profile ?? null),
    };
  }

  return Object.fromEntries(
    Object.entries(LOCAL_PROPERTY_VALUE_MAP).map(([key, propertyKey]) => [
      key,
      String(property[propertyKey] ?? ""),
    ]),
  );
}

function profilePlaceholderDefaults(
  profile: IndexedPropertyProfileDefaults | null,
): FieldValues {
  if (!profile) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(INDEXED_PROFILE_VALUE_MAP).flatMap(([key, profileKey]) => {
      const value = String(profile[profileKey] ?? "");

      return value ? [[key, value]] : [];
    }),
  );
}

export function buildDocumentFieldValues({
  placeholders,
  property,
  submittedValues,
}: {
  placeholders: string[];
  property: DocumentPropertySource;
  submittedValues: FieldValues;
}): FieldValues {
  const defaults = propertyPlaceholderDefaults(property);

  return Object.fromEntries(
    placeholders.map((key) => {
      const submitted = submittedValues[key]?.trim();
      return [key, submitted || defaults[key] || ""];
    }),
  );
}

function isIndexedProperty(property: DocumentPropertySource): property is PropertyIndex {
  return "sourceSpreadsheetId" in property;
}
