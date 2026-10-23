// Google Sheets returns cells as formatted text, so a lease date can arrive as
// "12/31/2026", "Dec 31, 2026", or "2026-12-31" depending on the sheet's
// number format. Everything downstream (dashboard, radar, assistant) compares
// dates as ISO YYYY-MM-DD, so sync normalizes recognizable dates at ingest and
// leaves anything else untouched.

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

// A cell formatted as "Date time" arrives as "12/31/2026 0:00:00".
const TRAILING_TIME = /[ T]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?\s*(?:[AaPp]\.?[Mm]\.?)?$/;

export function normalizeSpreadsheetDate(value: string): string {
  const text = value.trim();
  if (!text) {
    return text;
  }

  const parts = parseDateParts(text.replace(TRAILING_TIME, ""));
  if (!parts || !isValidDate(parts.year, parts.month, parts.day)) {
    return text;
  }

  return [
    String(parts.year).padStart(4, "0"),
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
}

function parseDateParts(
  text: string,
): { year: number; month: number; day: number } | null {
  // 2026-12-31, 2026/12/31
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }

  // 12/31/2026, 12-31-26. Month-first (US) unless the first number cannot be a
  // month, in which case the sheet is day-first.
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = expandYear(match[3]);
    return first > 12
      ? { year, month: second, day: first }
      : { year, month: first, day: second };
  }

  // Dec 31, 2026 / December 31 2026
  match = text.match(/^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/);
  if (match) {
    const month = monthFromName(match[1]);
    return month
      ? { year: Number(match[3]), month, day: Number(match[2]) }
      : null;
  }

  // 31 Dec 2026 / 31 December, 2026
  match = text.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (match) {
    const month = monthFromName(match[2]);
    return month
      ? { year: Number(match[3]), month, day: Number(match[1]) }
      : null;
  }

  return null;
}

function expandYear(value: string): number {
  const year = Number(value);
  return value.length === 2 ? 2000 + year : year;
}

function monthFromName(name: string): number | null {
  const key = name.toLowerCase();
  return MONTHS[key] ?? MONTHS[key.slice(0, 3)] ?? null;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Generated documents read better with "January 1, 2026" than an ISO date.
// Anything that is not an ISO date (free text like "Month to month") is
// returned unchanged.
export function formatDocumentDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return value;
  }

  const [year, month, day] = match.slice(1).map(Number);
  if (!isValidDate(year, month, day)) {
    return value;
  }

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
