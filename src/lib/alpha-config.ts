// Dummy alpha values for local/open-source setup checks only.
// Replace these with deployment-owned values in private environment variables.
export const alphaTesterEmail = "alpha-tester@example.com";

export const almanacTestPortfolio = {
  driveFolderName: "Almanac Test Portfolio",
  driveFolderUrl:
    "https://drive.google.com/drive/folders/dummy-almanac-test-portfolio",
  masterSpreadsheetName: "Almanac Test Master Spreadsheet",
  masterSpreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/dummy-almanac-test-master-spreadsheet/edit",
  sheetTabName: "Rentals",
} as const;
