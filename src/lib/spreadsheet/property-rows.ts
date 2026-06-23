export type MasterSpreadsheetRowsInput = {
  spreadsheetId: string;
  sheetName: string;
  headers: string[];
  rows: string[][];
};

export type ParsedPropertyIndexRow = {
  sourceSpreadsheetId: string;
  sourceSheetName: string;
  sourceRowNumber: number;
  address: string;
  normalizedAddress: string;
  currentTenants: string;
  rentAmount: string;
  leaseStart: string;
  leaseEnd: string;
  tenantPhone: string;
  tenantEmail: string;
  tenantBirthdays: string;
  pets: string;
  owner: string;
  brokerSplit: string;
  tenantNotes: string;
  status: string;
  rawJson: string;
  profile: ParsedPropertyProfile | null;
};

export type ParsedPropertyProfile = {
  accessCodes: string;
  applianceInfo: string;
  filterSize: string;
  homeWarranty: string;
  hoaInfo: string;
  utilityProviders: string;
};

export type MasterSpreadsheetColumnGuideField = {
  label: string;
  required: boolean;
  acceptedHeaders: string[];
};

export type MasterSpreadsheetColumnGuideSection = {
  title: string;
  description: string;
  fields: MasterSpreadsheetColumnGuideField[];
};

const FIELD_ALIASES = {
  address: ["property address", "address", "property"],
  currentTenants: ["current tenant(s)", "current tenants", "tenant", "tenant name"],
  rentAmount: ["rent amount", "rent"],
  leaseStart: ["lease start", "lease start date"],
  leaseEnd: ["lease end", "lease end date", "lease expiration"],
  tenantPhone: ["tenant phone", "phone"],
  tenantEmail: ["tenant email", "email"],
  tenantBirthdays: [
    "tenant birthdays",
    "tenant birthday",
    "tenant birthday(s)",
    "birthdays",
    "birthday",
  ],
  pets: ["pets"],
  owner: ["owner"],
  brokerSplit: ["broker split", "split"],
  tenantNotes: ["tenant notes", "notes"],
  status: ["status", "property status"],
} as const;

type FieldKey = keyof typeof FIELD_ALIASES;

const FIELD_LABELS: Record<FieldKey, string> = {
  address: "Property address",
  currentTenants: "Current tenant(s)",
  rentAmount: "Rent amount",
  leaseStart: "Lease start",
  leaseEnd: "Lease end",
  tenantPhone: "Tenant phone",
  tenantEmail: "Tenant email",
  tenantBirthdays: "Tenant birthday(s)",
  pets: "Pets",
  owner: "Owner",
  brokerSplit: "Broker split",
  tenantNotes: "Tenant notes",
  status: "Status",
};

const FIELD_GUIDE_ORDER: FieldKey[] = [
  "address",
  "currentTenants",
  "rentAmount",
  "leaseStart",
  "leaseEnd",
  "tenantPhone",
  "tenantEmail",
  "tenantBirthdays",
  "pets",
  "owner",
  "brokerSplit",
  "tenantNotes",
  "status",
];

const PROFILE_FIELD_ALIASES = {
  accessCodes: [
    "access codes",
    "access gate codes",
    "codes",
    "gate code",
    "garage code",
    "lockbox code",
  ],
  applianceInfo: ["appliance info", "appliance notes", "appliances"],
  filterSize: ["filter size", "filter", "hvac filter size"],
  homeWarranty: ["home warranty", "warranty", "warranty notes"],
  hoaInfo: ["hoa", "hoa info", "hoa notes"],
  utilityProviders: ["utilities", "utility notes", "utility providers"],
} as const;

type ProfileFieldKey = keyof typeof PROFILE_FIELD_ALIASES;

const PROFILE_FIELD_LABELS: Record<ProfileFieldKey, string> = {
  accessCodes: "Access codes",
  applianceInfo: "Appliance info",
  filterSize: "Filter size",
  homeWarranty: "Home warranty",
  hoaInfo: "HOA",
  utilityProviders: "Utility providers",
};

const PROFILE_FIELD_GUIDE_ORDER: ProfileFieldKey[] = [
  "applianceInfo",
  "filterSize",
  "homeWarranty",
  "hoaInfo",
  "utilityProviders",
  "accessCodes",
];

export function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getMasterSpreadsheetColumnGuide(): MasterSpreadsheetColumnGuideSection[] {
  return [
    {
      title: "Core property columns",
      description: "Property, tenant, lease, owner, and status fields.",
      fields: FIELD_GUIDE_ORDER.map((field) => ({
        label: FIELD_LABELS[field],
        required: field === "address",
        acceptedHeaders: FIELD_ALIASES[field].map(formatSpreadsheetHeader),
      })),
    },
    {
      title: "Optional property profile columns",
      description: "House reference details for filters, warranties, utilities, and access.",
      fields: PROFILE_FIELD_GUIDE_ORDER.map((field) => ({
        label: PROFILE_FIELD_LABELS[field],
        required: false,
        acceptedHeaders: PROFILE_FIELD_ALIASES[field].map(formatSpreadsheetHeader),
      })),
    },
  ];
}

function formatSpreadsheetHeader(alias: string): string {
  return alias
    .split(" ")
    .map((word) => {
      if (word === "hoa" || word === "hvac") {
        return word.toUpperCase();
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
}

export function parseMasterSpreadsheetRows(
  input: MasterSpreadsheetRowsInput,
): ParsedPropertyIndexRow[] {
  const headerMap = new Map<string, number>();
  input.headers.forEach((header, index) => {
    headerMap.set(normalizeSearchText(header), index);
  });

  return input.rows
    .map((row, rowIndex) => {
      const raw = Object.fromEntries(
        input.headers.map((header, index) => [header, String(row[index] ?? "").trim()]),
      );
      const value = (field: FieldKey) => {
        for (const alias of FIELD_ALIASES[field]) {
          const index = headerMap.get(normalizeSearchText(alias));
          if (index !== undefined) {
            return String(row[index] ?? "").trim();
          }
        }

        return "";
      };
      const profileValue = (field: ProfileFieldKey) => {
        for (const alias of PROFILE_FIELD_ALIASES[field]) {
          const index = headerMap.get(normalizeSearchText(alias));
          if (index !== undefined) {
            return String(row[index] ?? "").trim();
          }
        }

        return "";
      };
      const address = value("address");
      const profile = profileFromValues({
        accessCodes: profileValue("accessCodes"),
        applianceInfo: profileValue("applianceInfo"),
        filterSize: profileValue("filterSize"),
        homeWarranty: profileValue("homeWarranty"),
        hoaInfo: profileValue("hoaInfo"),
        utilityProviders: profileValue("utilityProviders"),
      });

      return {
        sourceSpreadsheetId: input.spreadsheetId,
        sourceSheetName: input.sheetName,
        sourceRowNumber: rowIndex + 2,
        address,
        normalizedAddress: normalizeSearchText(address),
        currentTenants: value("currentTenants"),
        rentAmount: value("rentAmount"),
        leaseStart: value("leaseStart"),
        leaseEnd: value("leaseEnd"),
        tenantPhone: value("tenantPhone"),
        tenantEmail: value("tenantEmail"),
        tenantBirthdays: value("tenantBirthdays"),
        pets: value("pets"),
        owner: value("owner"),
        brokerSplit: value("brokerSplit"),
        tenantNotes: value("tenantNotes"),
        status: value("status"),
        rawJson: JSON.stringify(raw),
        profile,
      };
    })
    .filter((row) => row.address !== "");
}

function profileFromValues(profile: ParsedPropertyProfile): ParsedPropertyProfile | null {
  return Object.values(profile).some((value) => value !== "") ? profile : null;
}
