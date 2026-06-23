import { describe, expect, it } from "vitest";
import {
  buildManualDriveSetupPlan,
  formatManualDriveSetupPlan,
} from "@/lib/fixtures/manual-drive-setup";

describe("manual Drive setup plan", () => {
  it("turns fixture paths into a Google Drive upload checklist", () => {
    const plan = buildManualDriveSetupPlan([
      "master-spreadsheet.csv",
      "Templates/move-in-checklist-template.md",
      "Loch Lomand/Leases/loch-lomand-lease-2026.md",
      "Wood Court/Projects/wood-court-turnover-scope.md",
      "README.md",
    ]);

    expect(plan.rootFolderName).toBe("Almanac Test Portfolio");
    expect(plan.masterSpreadsheetName).toBe("Almanac Test Master Spreadsheet");
    expect(plan.sheetName).toBe("Rentals");
    expect(plan.masterSpreadsheetCsv?.relativePath).toBe("master-spreadsheet.csv");
    expect(plan.templateFiles.map((file) => file.relativePath)).toEqual([
      "Templates/move-in-checklist-template.md",
    ]);
    expect(plan.propertyFiles.map((file) => file.relativePath)).toEqual([
      "Loch Lomand/Leases/loch-lomand-lease-2026.md",
      "Wood Court/Projects/wood-court-turnover-scope.md",
    ]);
    expect(plan.counts).toEqual({
      totalFiles: 5,
      propertyFiles: 2,
      templateFiles: 1,
      readmeFiles: 1,
    });
    expect(plan.checklist).toEqual(
      expect.arrayContaining([
        "Create a Google Drive folder named Almanac Test Portfolio.",
        "Create a Google Sheet named Almanac Test Master Spreadsheet and import master-spreadsheet.csv into a tab named Rentals.",
        "Upload the property folders and template files from build/almanac-test-portfolio-upload into the Drive folder.",
      ]),
    );
  });

  it("normalizes Windows-style paths and sorts files predictably", () => {
    const plan = buildManualDriveSetupPlan([
      "Wood Court\\Projects\\wood-court-turnover-scope.md",
      "Templates\\welcome-letter-template.md",
      "Loch Lomand\\Maintenance\\loch-lomand-hvac-filter-note.md",
    ]);

    expect(plan.templateFiles.map((file) => file.relativePath)).toEqual([
      "Templates/welcome-letter-template.md",
    ]);
    expect(plan.propertyFiles.map((file) => file.relativePath)).toEqual([
      "Loch Lomand/Maintenance/loch-lomand-hvac-filter-note.md",
      "Wood Court/Projects/wood-court-turnover-scope.md",
    ]);
  });

  it("formats a checklist that can travel with a manual upload bundle", () => {
    const plan = buildManualDriveSetupPlan([
      "master-spreadsheet.csv",
      "Templates/welcome-letter-template.md",
      "Loch Lomand/Leases/loch-lomand-lease-2026.md",
    ]);

    expect(formatManualDriveSetupPlan(plan)).toContain(
      "Almanac manual Google Drive setup",
    );
    expect(formatManualDriveSetupPlan(plan)).toContain(
      "Upload bundle: build/almanac-test-portfolio-upload",
    );
    expect(formatManualDriveSetupPlan(plan)).toContain(
      "Almanac test site: https://almanac-alpha.example.com/settings/google",
    );
    expect(formatManualDriveSetupPlan(plan)).toContain(
      "- Templates/welcome-letter-template.md",
    );
  });
});
