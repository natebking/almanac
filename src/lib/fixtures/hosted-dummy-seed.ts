import { alphaTesterEmail } from "@/lib/alpha-config";

export type HostedDummyProperty = {
  address: string;
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
  profile: {
    applianceInfo: string;
    filterSize: string;
    homeWarranty: string;
    hoaInfo: string;
    utilityProviders: string;
    accessCodes: string;
  };
};

export type HostedDummyDriveFile = {
  propertyAddress: string;
  googleFileId: string;
  name: string;
  mimeType: string;
  category: string;
  webViewLink: string;
  modifiedTime: string;
  textExtract: string;
};

export type HostedDummyTemplate = {
  googleDocId: string;
  name: string;
  description: string;
  googleDocUrl: string;
  localBody: string;
};

export type HostedDummyVendor = {
  name: string;
  trade: string;
  phone: string;
  email: string;
  notes: string;
  licenseStatus: string;
  insuranceStatus: string;
  propertyAddresses: string[];
};

export type HostedDummySeedPlan = {
  targetEmail: string;
  propertyAddresses: string[];
  templateNames: string[];
  counts: {
    properties: number;
    profiles: number;
    driveFiles: number;
    vendors: number;
    templates: number;
    generatedDocuments: number;
  };
};

export const hostedDummyProperties: HostedDummyProperty[] = [
  {
    address: "161 Loch Lomand Drive",
    currentTenants: "Avery Johnson",
    rentAmount: "2450",
    leaseStart: "2026-01-01",
    leaseEnd: "2026-12-31",
    tenantPhone: "555-0101",
    tenantEmail: "avery@example.com",
    tenantBirthdays: "June 20",
    pets: "1 dog",
    owner: "Example Owner Trust",
    brokerSplit: "50/50",
    tenantNotes: "Prefers text. Needs AC filter reminder.",
    status: "Occupied",
    profile: {
      applianceInfo: "Whirlpool washer, GE fridge",
      filterSize: "20x25x1",
      homeWarranty: "Liberty Home Guard",
      hoaInfo: "None",
      utilityProviders: "Duke Energy, City Water",
      accessCodes: "Garage 1234",
    },
  },
  {
    address: "22 Verona Court",
    currentTenants: "Mia Chen",
    rentAmount: "2850",
    leaseStart: "2026-03-15",
    leaseEnd: "2027-03-14",
    tenantPhone: "555-0102",
    tenantEmail: "mia@example.com",
    tenantBirthdays: "September 3",
    pets: "None",
    owner: "M. Alvarez",
    brokerSplit: "60/40",
    tenantNotes: "Good tenant. Asked about utility transfer.",
    status: "Occupied",
    profile: {
      applianceInfo: "Samsung fridge, Bosch dishwasher",
      filterSize: "16x20x1",
      homeWarranty: "None",
      hoaInfo: "Verona HOA",
      utilityProviders: "Duke Energy, Spectrum",
      accessCodes: "Gate 2468",
    },
  },
  {
    address: "48 St. Paul Street",
    currentTenants: "Jordan Lee",
    rentAmount: "2300",
    leaseStart: "2025-09-01",
    leaseEnd: "2026-08-31",
    tenantPhone: "555-0103",
    tenantEmail: "jordan@example.com",
    tenantBirthdays: "July 11",
    pets: "1 cat",
    owner: "Example Owner Trust",
    brokerSplit: "50/50",
    tenantNotes: "Lease expires soon enough for dashboard testing.",
    status: "Occupied",
    profile: {
      applianceInfo: "GE range, LG washer",
      filterSize: "20x20x1",
      homeWarranty: "First American",
      hoaInfo: "None",
      utilityProviders: "City Water, Piedmont Gas",
      accessCodes: "Lockbox 4321",
    },
  },
  {
    address: "9 Wood Court",
    currentTenants: "Vacant",
    rentAmount: "0",
    leaseStart: "",
    leaseEnd: "",
    tenantPhone: "",
    tenantEmail: "",
    tenantBirthdays: "",
    pets: "",
    owner: "K. Patel",
    brokerSplit: "50/50",
    tenantNotes: "Turnover cleaning in progress.",
    status: "Vacant",
    profile: {
      applianceInfo: "Empty",
      filterSize: "16x25x1",
      homeWarranty: "None",
      hoaInfo: "Wood Court HOA",
      utilityProviders: "Duke Energy",
      accessCodes: "Contractor code 9090",
    },
  },
  {
    address: "77 Estates Lane",
    currentTenants: "Olivia Martin",
    rentAmount: "3150",
    leaseStart: "2026-02-01",
    leaseEnd: "2027-01-31",
    tenantPhone: "555-0104",
    tenantEmail: "olivia@example.com",
    tenantBirthdays: "December 9",
    pets: "None",
    owner: "R. Weston",
    brokerSplit: "70/30",
    tenantNotes: "HVAC warranty stored in Drive.",
    status: "Occupied",
    profile: {
      applianceInfo: "KitchenAid fridge, Rheem water heater",
      filterSize: "20x30x1",
      homeWarranty: "Choice Home Warranty",
      hoaInfo: "Estates HOA",
      utilityProviders: "Duke Energy, Aqua",
      accessCodes: "Garage 7777",
    },
  },
];

export const hostedDummyDriveFiles: HostedDummyDriveFile[] = [
  driveFile("161 Loch Lomand Drive", "lease-loch-lomand-2026", "Loch Lomand Lease 2026", "lease", "Lease for Loch Lomand. Avery Johnson lease. Rent is 2450. Lease ends 2026-12-31."),
  driveFile("161 Loch Lomand Drive", "maintenance-loch-lomand-hvac-filter", "Loch Lomand HVAC Filter Note", "maintenance", "AC filter size is 20x25x1. Clear Air HVAC replaced filters in May."),
  driveFile("161 Loch Lomand Drive", "financial-loch-lomand-owner-statement-may", "Loch Lomand Owner Statement May", "financial", "Owner statement for Loch Lomand. Rent received: 2450."),
  driveFile("22 Verona Court", "application-verona-summary", "Verona Application Summary", "application", "Mia Chen application summary. Excellent references."),
  driveFile("22 Verona Court", "lease-verona-2026", "Verona Lease 2026", "lease", "Mia Chen lease. Rent is 2850. Utility transfer requested."),
  driveFile("48 St. Paul Street", "lease-st-paul-2025", "St. Paul Lease 2025", "lease", "Jordan Lee lease. Lease ends 2026-08-31."),
  driveFile("48 St. Paul Street", "maintenance-st-paul-inspection-note", "St. Paul Inspection Note", "maintenance", "Inspection note for St. Paul. Lockbox 4321."),
  driveFile("9 Wood Court", "project-wood-court-turnover-scope", "Wood Court Turnover Scope", "project", "Painting, cleaning, and lock change are active."),
  driveFile("9 Wood Court", "maintenance-wood-court-lock-change", "Wood Court Lock Change", "maintenance", "Lock change completed for vacant Wood Court."),
  driveFile("77 Estates Lane", "maintenance-estates-hvac-warranty", "Estates HVAC Warranty", "maintenance", "Choice Home Warranty covers HVAC. Clear Air HVAC completed repair."),
  driveFile("77 Estates Lane", "financial-estates-owner-statement-may", "Estates Owner Statement May", "financial", "Fake owner statement with a maintenance expense."),
  driveFile("77 Estates Lane", "project-estates-owner-update-draft", "Estates Owner Update Draft", "project", "Draft owner update for completed HVAC repair at Estates."),
];

export const hostedDummyTemplates: HostedDummyTemplate[] = [
  {
    googleDocId: "template-move-in-checklist",
    name: "Move-In Checklist",
    description: "Checklist for tenant move-in packets.",
    googleDocUrl: "https://docs.google.com/document/d/template-move-in-checklist",
    localBody: [
      "Move-In Checklist",
      "",
      "Tenant: {{tenant_name}}",
      "Property: {{property_address}}",
      "Lease start: {{lease_start}}",
      "Tenant phone: {{tenant_phone}}",
      "",
      "- Confirm keys are delivered.",
      "- Confirm utilities are transferred.",
      "- Confirm filter size: {{filter_size}}.",
    ].join("\n"),
  },
  {
    googleDocId: "template-utility-transfer-letter",
    name: "Utility Transfer Letter",
    description: "Letter for utility transfer instructions.",
    googleDocUrl: "https://docs.google.com/document/d/template-utility-transfer-letter",
    localBody: [
      "Utility Transfer Letter",
      "",
      "Property: {{property_address}}",
      "Utilities: {{utility_providers}}",
    ].join("\n"),
  },
  {
    googleDocId: "template-welcome-letter",
    name: "Welcome Letter",
    description: "Welcome letter for new tenants.",
    googleDocUrl: "https://docs.google.com/document/d/template-welcome-letter",
    localBody: [
      "Welcome Letter",
      "",
      "Welcome {{tenant_name}} to {{property_address}}.",
      "Owner: {{owner}}",
    ].join("\n"),
  },
];

export const hostedDummyVendors: HostedDummyVendor[] = [
  {
    name: "Clear Air HVAC",
    trade: "HVAC",
    phone: "555-0188",
    email: "service@clearair.example",
    notes: "Use for seasonal maintenance and warranty repairs.",
    licenseStatus: "License on file",
    insuranceStatus: "Insurance on file",
    propertyAddresses: ["161 Loch Lomand Drive", "77 Estates Lane"],
  },
  {
    name: "Reliable Lock & Key",
    trade: "Locksmith",
    phone: "555-0142",
    email: "dispatch@reliablelock.example",
    notes: "Used for Wood Court lock change.",
    licenseStatus: "License on file",
    insuranceStatus: "Insurance on file",
    propertyAddresses: ["9 Wood Court"],
  },
];

export function validateHostedDummySeedTarget(input: {
  targetEmail: string | undefined;
  allowedEmails: string | undefined;
}): string {
  const targetEmail = normalizeEmail(input.targetEmail);
  const expectedEmail = alphaTesterEmail;

  if (targetEmail !== expectedEmail) {
    throw new Error(
      `Refusing to seed hosted dummy data for ${targetEmail || "blank target"}. Expected ${expectedEmail}.`,
    );
  }

  if (!normalizedEmails(input.allowedEmails).includes(expectedEmail)) {
    throw new Error(`ALMANAC_ALLOWED_EMAILS must include ${expectedEmail}.`);
  }

  return expectedEmail;
}

export function buildHostedDummySeedPlan(
  targetEmail: string,
): HostedDummySeedPlan {
  return {
    targetEmail: normalizeEmail(targetEmail),
    propertyAddresses: hostedDummyProperties.map((property) => property.address),
    templateNames: hostedDummyTemplates.map((template) => template.name).sort(),
    counts: {
      properties: hostedDummyProperties.length,
      profiles: hostedDummyProperties.length,
      driveFiles: hostedDummyDriveFiles.length,
      vendors: hostedDummyVendors.length,
      templates: hostedDummyTemplates.length,
      generatedDocuments: 1,
    },
  };
}

export function formatHostedDummySeedPlan(plan: HostedDummySeedPlan): string {
  return [
    "Almanac hosted dummy database seed",
    "",
    `Target user: ${plan.targetEmail}`,
    "",
    "Records:",
    `- Properties: ${plan.counts.properties}`,
    `- Profiles: ${plan.counts.profiles}`,
    `- Drive files: ${plan.counts.driveFiles}`,
    `- Vendors: ${plan.counts.vendors}`,
    `- Templates: ${plan.counts.templates}`,
    `- Generated documents: ${plan.counts.generatedDocuments}`,
    "",
    "Properties:",
    ...plan.propertyAddresses.map((address) => `- ${address}`),
    "",
    "Templates:",
    ...plan.templateNames.map((name) => `- ${name}`),
    "",
  ].join("\n");
}

function driveFile(
  propertyAddress: string,
  googleFileId: string,
  name: string,
  category: string,
  textExtract: string,
): HostedDummyDriveFile {
  return {
    propertyAddress,
    googleFileId,
    name,
    mimeType: "text/markdown",
    category,
    webViewLink: `https://drive.google.com/file/d/${googleFileId}`,
    modifiedTime: "2026-06-17T12:00:00.000Z",
    textExtract,
  };
}

function normalizeEmail(email: string | undefined): string {
  return (email || "").trim().toLowerCase();
}

function normalizedEmails(value: string | undefined): string[] {
  return (value || "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
