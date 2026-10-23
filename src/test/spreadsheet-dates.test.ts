import { describe, expect, it } from "vitest";
import {
  formatDocumentDate,
  normalizeSpreadsheetDate,
} from "@/lib/spreadsheet/dates";
import { parseMasterSpreadsheetRows } from "@/lib/spreadsheet/property-rows";

describe("normalizeSpreadsheetDate", () => {
  it.each([
    ["2026-12-31", "2026-12-31"],
    ["2026/1/5", "2026-01-05"],
    ["12/31/2026", "2026-12-31"],
    ["1/5/26", "2026-01-05"],
    ["31/12/2026", "2026-12-31"],
    ["Dec 31, 2026", "2026-12-31"],
    ["December 31 2026", "2026-12-31"],
    ["Sept. 3, 2026", "2026-09-03"],
    ["31 Dec 2026", "2026-12-31"],
    [" 3/1/2027 ", "2027-03-01"],
    ["12/31/2026 0:00:00", "2026-12-31"],
    ["2026-12-31T00:00:00", "2026-12-31"],
    ["Dec 31, 2026 9:30 AM", "2026-12-31"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeSpreadsheetDate(input)).toBe(expected);
  });

  it.each(["", "TBD", "Month to month", "2/30/2026", "13/13/2026", "June 20"])(
    "leaves %j unchanged when it is not a full calendar date",
    (input) => {
      expect(normalizeSpreadsheetDate(input)).toBe(input.trim());
    },
  );
});

describe("formatDocumentDate", () => {
  it("writes ISO dates the way a person reads them", () => {
    expect(formatDocumentDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatDocumentDate("2026-12-31")).toBe("December 31, 2026");
  });

  it.each(["", "Month to month", "2026-02-30", "12/31/2026"])(
    "leaves %j unchanged",
    (input) => {
      expect(formatDocumentDate(input)).toBe(input);
    },
  );
});

describe("parseMasterSpreadsheetRows lease dates", () => {
  it("stores US-formatted Google Sheets lease dates as ISO dates", () => {
    const [row] = parseMasterSpreadsheetRows({
      spreadsheetId: "sheet",
      sheetName: "Rentals",
      headers: ["Property Address", "Lease Start", "Lease End"],
      rows: [["1 Alpha St", "1/1/2026", "12/31/2026"]],
    });

    expect(row.leaseStart).toBe("2026-01-01");
    expect(row.leaseEnd).toBe("2026-12-31");
    expect(JSON.parse(row.rawJson)["Lease End"]).toBe("12/31/2026");
  });
});
