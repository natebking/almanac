export type HouseProfileSummaryInput = {
  applianceInfo: string;
  filterSize: string;
  homeWarranty: string;
  hoaInfo: string;
  utilityProviders: string;
  accessCodes: string;
} | null;

export type HouseProfileItem = {
  label: string;
  value: string;
};

const PROFILE_FIELDS = [
  { label: "Appliances", key: "applianceInfo" },
  { label: "Filter size", key: "filterSize" },
  { label: "Home warranty", key: "homeWarranty" },
  { label: "HOA", key: "hoaInfo" },
  { label: "Utilities", key: "utilityProviders" },
  { label: "Codes", key: "accessCodes" },
] as const;

export function buildHouseProfileItems(
  profile: HouseProfileSummaryInput,
): HouseProfileItem[] {
  if (!profile) {
    return [];
  }

  return PROFILE_FIELDS.flatMap((field) => {
    const value = profile[field.key].trim();

    return value ? [{ label: field.label, value }] : [];
  });
}
