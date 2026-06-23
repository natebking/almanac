/**
 * Almanac dummy Google Drive portfolio creator.
 *
 * Paste this file into Google Apps Script while signed in as the test account,
 * then run createAlmanacTestPortfolio().
 *
 * It creates:
 * - Almanac Test Portfolio Drive folder
 * - One fake property folder per test property
 * - Standard subfolders under each property
 * - Google Docs for leases, maintenance notes, financial notes, projects, and templates
 * - Almanac Test Master Spreadsheet with a Rentals tab
 * - A setup receipt doc with URLs
 */
const ROOT_FOLDER_NAME = "Almanac Test Portfolio";
const MASTER_SPREADSHEET_TITLE = "Almanac Test Master Spreadsheet";
const RECEIPT_DOC_TITLE = "Almanac Test Portfolio Setup Receipt";

function previewAlmanacTestPortfolioPlan() {
  Logger.log("Almanac dummy portfolio setup plan");
  Logger.log("Root folder: " + ROOT_FOLDER_NAME);
  Logger.log("Spreadsheet: " + MASTER_SPREADSHEET_TITLE + " / Rentals");
  Logger.log("Templates: " + TEMPLATE_DOCS.map((doc) => doc.title).join(", "));
  Logger.log("Properties: " + PROPERTY_DOCS.map((property) => property.folder).join(", "));
  Logger.log(
    "This script will create fake Google Drive folders, Google Docs, and one Google Sheet in the signed-in test account.",
  );
  Logger.log(
    "Run createAlmanacTestPortfolio only from alpha-tester@example.com or another disposable test account.",
  );
}

function createAlmanacTestPortfolio() {
  const root = getOrCreateFolder_(DriveApp.getRootFolder(), ROOT_FOLDER_NAME);
  const createdAt = new Date();
  assertNoPriorCompletedSetup_(root);

  const masterSheet = createMasterSpreadsheet_(root);
  createTemplateDocs_(root);
  createPropertyFoldersAndDocs_(root);

  const receipt = DocumentApp.create(RECEIPT_DOC_TITLE);
  receipt.getBody().setText(
    [
      "Almanac Test Portfolio Setup Receipt",
      "",
      "Created: " + createdAt.toISOString(),
      "Root folder: " + root.getUrl(),
      "Master spreadsheet: " + masterSheet.getUrl(),
      "",
      "Use these values in Almanac /settings/google:",
      "Drive root folder URL: " + root.getUrl(),
      "Master spreadsheet URL: " + masterSheet.getUrl(),
      "Sheet tab: Rentals",
    ].join("\n"),
  );
  DriveApp.getFileById(receipt.getId()).moveTo(root);

  Logger.log("Almanac Test Portfolio folder: " + root.getUrl());
  Logger.log("Almanac Test Master Spreadsheet: " + masterSheet.getUrl());
}

function createMasterSpreadsheet_(root) {
  const spreadsheet = SpreadsheetApp.create(MASTER_SPREADSHEET_TITLE);
  const sheet = spreadsheet.getSheets()[0];
  sheet.setName("Rentals");
  sheet
    .getRange(1, 1, MASTER_ROWS.length, MASTER_ROWS[0].length)
    .setValues(MASTER_ROWS);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, MASTER_ROWS[0].length);
  DriveApp.getFileById(spreadsheet.getId()).moveTo(root);
  return spreadsheet;
}

function createTemplateDocs_(root) {
  const templates = getOrCreateFolder_(root, "Templates");
  for (const doc of TEMPLATE_DOCS) {
    createDocInFolder_(templates, doc.title, doc.body);
  }
}

function createPropertyFoldersAndDocs_(root) {
  for (const property of PROPERTY_DOCS) {
    const propertyFolder = getOrCreateFolder_(root, property.folder);
    for (const subfolder of PROPERTY_SUBFOLDERS) {
      getOrCreateFolder_(propertyFolder, subfolder);
    }
    for (const doc of property.docs) {
      const target = getOrCreateFolder_(propertyFolder, doc.subfolder);
      createDocInFolder_(target, doc.title, doc.body);
    }
  }
}

function createDocInFolder_(folder, title, body) {
  const doc = DocumentApp.create(title);
  doc.getBody().setText(body);
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).moveTo(folder);
  return doc;
}

function getOrCreateFolder_(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) {
    return existing.next();
  }
  return parent.createFolder(name);
}

function assertNoPriorCompletedSetup_(root) {
  if (
    root.getFilesByName(RECEIPT_DOC_TITLE).hasNext() ||
    root.getFilesByName(MASTER_SPREADSHEET_TITLE).hasNext()
  ) {
    throw new Error(
      "Almanac Test Portfolio already appears to be created. Open the existing setup receipt in Drive, or delete/rename the existing '" +
        ROOT_FOLDER_NAME +
        "' folder before running this script again.",
    );
  }
}

const PROPERTY_SUBFOLDERS = [
  "Applications",
  "Financial",
  "Leases",
  "Maintenance",
  "Photos",
  "Projects",
];

const MASTER_ROWS = [
  [
    "Property Address",
    "Current Tenant(s)",
    "Rent Amount",
    "Lease Start",
    "Lease End",
    "Tenant Phone",
    "Tenant Email",
    "Tenant Birthdays",
    "Pets",
    "Owner",
    "Broker Split",
    "Tenant Notes",
    "Status",
    "Appliance Info",
    "Filter Size",
    "Home Warranty",
    "HOA",
    "Utility Providers",
    "Access Codes",
  ],
  [
    "161 Loch Lomand Drive",
    "Avery Johnson",
    2450,
    "2026-01-01",
    "2026-12-31",
    "555-0101",
    "avery@example.com",
    "June 20",
    "1 dog",
    "Example Owner Trust",
    "50/50",
    "Prefers text. Needs AC filter reminder.",
    "Occupied",
    "Whirlpool washer, GE fridge",
    "20x25x1",
    "Liberty Home Guard",
    "None",
    "Duke Energy, City Water",
    "Garage 1234",
  ],
  [
    "22 Verona Court",
    "Mia Chen",
    2850,
    "2026-03-15",
    "2027-03-14",
    "555-0102",
    "mia@example.com",
    "September 3",
    "None",
    "M. Alvarez",
    "60/40",
    "Good tenant. Asked about utility transfer.",
    "Occupied",
    "Samsung fridge, Bosch dishwasher",
    "16x20x1",
    "None",
    "Verona HOA",
    "Duke Energy, Spectrum",
    "Gate 2468",
  ],
  [
    "48 St. Paul Street",
    "Jordan Lee",
    2300,
    "2025-09-01",
    "2026-08-31",
    "555-0103",
    "jordan@example.com",
    "July 11",
    "1 cat",
    "Example Owner Trust",
    "50/50",
    "Lease expires soon enough for dashboard testing.",
    "Occupied",
    "GE range, LG washer",
    "20x20x1",
    "First American",
    "None",
    "City Water, Piedmont Gas",
    "Lockbox 4321",
  ],
  [
    "9 Wood Court",
    "Vacant",
    0,
    "",
    "",
    "",
    "",
    "",
    "",
    "K. Patel",
    "50/50",
    "Turnover cleaning in progress.",
    "Vacant",
    "Empty",
    "16x25x1",
    "None",
    "Wood Court HOA",
    "Duke Energy",
    "Contractor code 9090",
  ],
  [
    "77 Estates Lane",
    "Olivia Martin",
    3150,
    "2026-02-01",
    "2027-01-31",
    "555-0104",
    "olivia@example.com",
    "December 9",
    "None",
    "R. Weston",
    "70/30",
    "HVAC warranty stored in Drive.",
    "Occupied",
    "KitchenAid fridge, Rheem water heater",
    "20x30x1",
    "Choice Home Warranty",
    "Estates HOA",
    "Duke Energy, Aqua",
    "Garage 7777",
  ],
];

const TEMPLATE_DOCS = [
  {
    title: "Move-In Checklist Template",
    body:
      "Move-In Checklist\n\n" +
      "Property: {{property_address}}\n" +
      "Tenant: {{tenant_name}}\n" +
      "Lease start: {{lease_start}}\n" +
      "Tenant phone: {{tenant_phone}}\n\n" +
      "- Confirm keys and access codes.\n" +
      "- Confirm utility transfer.\n" +
      "- Review trash day and HOA notes.\n" +
      "- Confirm filter size and appliance notes.\n",
  },
  {
    title: "Welcome Letter Template",
    body:
      "Welcome Letter\n\n" +
      "Hi {{tenant_name}},\n\n" +
      "Welcome to {{property_address}}. Your lease begins on {{lease_start}}.\n" +
      "Please keep this letter with your move-in documents.\n\n" +
      "Utilities: {{utility_providers}}\n" +
      "Owner: {{owner}}\n",
  },
  {
    title: "Utility Transfer Letter Template",
    body:
      "Utility Transfer Letter\n\n" +
      "Property: {{property_address}}\n" +
      "Tenant: {{tenant_name}}\n\n" +
      "Please transfer utilities before the lease start date.\n" +
      "Utility providers: {{utility_providers}}\n",
  },
];

const PROPERTY_DOCS = [
  {
    folder: "Loch Lomand",
    docs: [
      {
        subfolder: "Leases",
        title: "Loch Lomand Lease 2026",
        body:
          "Loch Lomand Lease 2026\n\n" +
          "Property: 161 Loch Lomand Drive\n" +
          "Tenant: Avery Johnson\n" +
          "Rent: 2450\n" +
          "Lease start: 2026-01-01\n" +
          "Lease end: 2026-12-31\n" +
          "Pets: 1 dog\n" +
          "Tenant phone: 555-0101\n",
      },
      {
        subfolder: "Maintenance",
        title: "Loch Lomand HVAC Filter Note",
        body:
          "Loch Lomand HVAC Filter Note\n\n" +
          "Property: 161 Loch Lomand Drive\n" +
          "Vendor: Clear Air HVAC\n" +
          "Status: completed\n" +
          "Completed date: 2026-05-12\n" +
          "Filter size: 20x25x1\n",
      },
      {
        subfolder: "Financial",
        title: "Loch Lomand Owner Statement May",
        body:
          "Loch Lomand Owner Statement May\n\n" +
          "Property: 161 Loch Lomand Drive\n" +
          "Owner: Example Owner Trust\n" +
          "Month: May 2026\n" +
          "Rent received: 2450\n" +
          "Maintenance expense: 85\n",
      },
    ],
  },
  {
    folder: "Verona",
    docs: [
      {
        subfolder: "Applications",
        title: "Verona Application Summary",
        body:
          "Verona Application Summary\n\n" +
          "Property: 22 Verona Court\n" +
          "Applicant: Mia Chen\n" +
          "Application status: approved\n" +
          "Summary: Mia Chen has excellent references and stable income.\n",
      },
      {
        subfolder: "Leases",
        title: "Verona Lease 2026",
        body:
          "Verona Lease 2026\n\n" +
          "Property: 22 Verona Court\n" +
          "Tenant: Mia Chen\n" +
          "Rent: 2850\n" +
          "Lease start: 2026-03-15\n" +
          "Lease end: 2027-03-14\n",
      },
    ],
  },
  {
    folder: "St. Paul",
    docs: [
      {
        subfolder: "Leases",
        title: "St. Paul Lease 2025",
        body:
          "St. Paul Lease 2025\n\n" +
          "Property: 48 St. Paul Street\n" +
          "Tenant: Jordan Lee\n" +
          "Rent: 2300\n" +
          "Lease start: 2025-09-01\n" +
          "Lease end: 2026-08-31\n",
      },
      {
        subfolder: "Maintenance",
        title: "St. Paul Inspection Note",
        body:
          "St. Paul Inspection Note\n\n" +
          "Property: 48 St. Paul Street\n" +
          "Status: scheduled\n" +
          "Inspection window: 2026-07-15\n" +
          "Jordan Lee asked for text confirmation before arrival.\n",
      },
    ],
  },
  {
    folder: "Wood Court",
    docs: [
      {
        subfolder: "Projects",
        title: "Wood Court Turnover Scope",
        body:
          "Wood Court Turnover Scope\n\n" +
          "Property: 9 Wood Court\n" +
          "Status: active\n" +
          "Project type: turnover\n" +
          "Open work: interior painting, cleaning, and lock change.\n",
      },
      {
        subfolder: "Maintenance",
        title: "Wood Court Lock Change",
        body:
          "Wood Court Lock Change\n\n" +
          "Property: 9 Wood Court\n" +
          "Vendor: Secure Entry Locksmith\n" +
          "Status: scheduled\n" +
          "Secure Entry Locksmith will rekey front and back doors.\n",
      },
    ],
  },
  {
    folder: "Estates",
    docs: [
      {
        subfolder: "Maintenance",
        title: "Estates HVAC Warranty",
        body:
          "Estates HVAC Warranty\n\n" +
          "Property: 77 Estates Lane\n" +
          "Vendor: Clear Air HVAC\n" +
          "Warranty: Choice Home Warranty\n" +
          "Status: completed\n" +
          "Clear Air HVAC completed the covered HVAC repair.\n",
      },
      {
        subfolder: "Financial",
        title: "Estates Owner Statement May",
        body:
          "Estates Owner Statement May\n\n" +
          "Property: 77 Estates Lane\n" +
          "Owner: R. Weston\n" +
          "Month: May 2026\n" +
          "Rent received: 3150\n" +
          "Maintenance expense: 410\n",
      },
      {
        subfolder: "Projects",
        title: "Estates Owner Update Draft",
        body:
          "Estates Owner Update Draft\n\n" +
          "Property: 77 Estates Lane\n" +
          "Owner: R. Weston\n" +
          "Draft: The HVAC repair at Estates has been completed under the Choice Home Warranty plan.\n",
      },
    ],
  },
];
