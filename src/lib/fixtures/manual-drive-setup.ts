export type ManualDriveSetupFile = {
  relativePath: string;
  folderPath: string;
  fileName: string;
};

export type ManualDriveSetupPlan = {
  rootFolderName: string;
  masterSpreadsheetName: string;
  sheetName: string;
  masterSpreadsheetCsv?: ManualDriveSetupFile;
  templateFiles: ManualDriveSetupFile[];
  propertyFiles: ManualDriveSetupFile[];
  counts: {
    totalFiles: number;
    propertyFiles: number;
    templateFiles: number;
    readmeFiles: number;
  };
  checklist: string[];
};

export function buildManualDriveSetupPlan(
  relativePaths: string[],
): ManualDriveSetupPlan {
  const files = relativePaths.map(normalizeFixturePath).sort(comparePaths);
  const templateFiles = files.filter((file) => file.relativePath.startsWith("Templates/"));
  const propertyFiles = files.filter(
    (file) =>
      file.relativePath !== "master-spreadsheet.csv" &&
      !file.relativePath.startsWith("Templates/") &&
      file.fileName.toLowerCase() !== "readme.md",
  );

  return {
    rootFolderName: "Almanac Test Portfolio",
    masterSpreadsheetName: "Almanac Test Master Spreadsheet",
    sheetName: "Rentals",
    masterSpreadsheetCsv: files.find(
      (file) => file.relativePath === "master-spreadsheet.csv",
    ),
    templateFiles,
    propertyFiles,
    counts: {
      totalFiles: files.length,
      propertyFiles: propertyFiles.length,
      templateFiles: templateFiles.length,
      readmeFiles: files.filter((file) => file.fileName.toLowerCase() === "readme.md")
        .length,
    },
    checklist: [
      "Create a Google Drive folder named Almanac Test Portfolio.",
      "Create a Google Sheet named Almanac Test Master Spreadsheet and import master-spreadsheet.csv into a tab named Rentals.",
      "Upload the property folders and template files from build/almanac-test-portfolio-upload into the Drive folder.",
      "Paste the Drive folder URL, Google Sheet URL, and Rentals tab name into Almanac /settings/google.",
    ],
  };
}

export function formatManualDriveSetupPlan(plan: ManualDriveSetupPlan): string {
  const lines = [
    "Almanac manual Google Drive setup",
    "",
    `Drive folder: ${plan.rootFolderName}`,
    `Google Sheet: ${plan.masterSpreadsheetName}`,
    `Sheet tab: ${plan.sheetName}`,
    "Upload bundle: build/almanac-test-portfolio-upload",
    "Almanac test site: https://almanac-alpha.example.com/settings/google",
    "",
    "Checklist:",
    ...plan.checklist.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Files:",
    `- Total files: ${plan.counts.totalFiles}`,
    `- Property files: ${plan.counts.propertyFiles}`,
    `- Template files: ${plan.counts.templateFiles}`,
    `- Readme files: ${plan.counts.readmeFiles}`,
  ];

  if (plan.masterSpreadsheetCsv) {
    lines.push("", "Spreadsheet import:", `- ${plan.masterSpreadsheetCsv.relativePath}`);
  }

  if (plan.templateFiles.length > 0) {
    lines.push("", "Template files:");
    lines.push(...plan.templateFiles.map((file) => `- ${file.relativePath}`));
  }

  if (plan.propertyFiles.length > 0) {
    lines.push("", "Property files:");
    lines.push(...plan.propertyFiles.map((file) => `- ${file.relativePath}`));
  }

  return `${lines.join("\n")}\n`;
}

function normalizeFixturePath(relativePath: string): ManualDriveSetupFile {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  const parts = normalized.split("/").filter(Boolean);
  const fileName = parts.at(-1) ?? normalized;
  const folderPath = parts.slice(0, -1).join("/");

  return {
    relativePath: parts.join("/"),
    folderPath,
    fileName,
  };
}

function comparePaths(a: ManualDriveSetupFile, b: ManualDriveSetupFile) {
  return a.relativePath.localeCompare(b.relativePath);
}
