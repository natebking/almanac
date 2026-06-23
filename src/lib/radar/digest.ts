// Weekly digest: the push companion to the radar. It takes the full obligation
// list and produces the short "here is what is coming this week" summary that
// an operator would receive by email or read in-app, so a tool they do not have
// to remember to open still reaches them.

import type { RadarObligation, RadarObligationKind } from "@/lib/radar/obligations";

export type WeeklyDigestSection = {
  kind: RadarObligationKind;
  heading: string;
  obligations: RadarObligation[];
};

export type WeeklyDigest = {
  /** ISO date (YYYY-MM-DD) the digest was generated for. */
  generatedFor: string;
  horizonDays: number;
  itemCount: number;
  subject: string;
  sections: WeeklyDigestSection[];
  /** Plain-text body suitable for an email or SMS. */
  text: string;
};

const SECTION_ORDER: { kind: RadarObligationKind; heading: string }[] = [
  { kind: "lease-expiry", heading: "Leases expiring" },
  { kind: "move-in", heading: "Move-ins" },
  { kind: "birthday", heading: "Tenant birthdays" },
  { kind: "vacancy", heading: "Vacancies to fill" },
];

export function buildWeeklyDigest(input: {
  today: Date;
  obligations: RadarObligation[];
  horizonDays?: number;
}): WeeklyDigest {
  const horizonDays = input.horizonDays ?? 7;
  const generatedFor = input.today.toISOString().slice(0, 10);

  // Include anything dated within the horizon, plus ongoing items (vacancies).
  const due = input.obligations.filter(
    (obligation) =>
      obligation.daysUntil === null || obligation.daysUntil <= horizonDays,
  );

  const sections = SECTION_ORDER.flatMap((section) => {
    const obligations = due.filter(
      (obligation) => obligation.kind === section.kind,
    );

    if (obligations.length === 0) {
      return [];
    }

    return [{ kind: section.kind, heading: section.heading, obligations }];
  });

  const itemCount = due.length;
  const subject =
    itemCount === 0
      ? "Almanac: nothing needs attention this week"
      : `Almanac: ${itemCount} ${itemCount === 1 ? "thing" : "things"} this week`;

  return {
    generatedFor,
    horizonDays,
    itemCount,
    subject,
    sections,
    text: renderText(subject, sections, generatedFor),
  };
}

function renderText(
  subject: string,
  sections: WeeklyDigestSection[],
  generatedFor: string,
): string {
  const lines = [subject, `Week of ${generatedFor}`, ""];

  if (sections.length === 0) {
    lines.push("Nothing time-sensitive in the next week. Have a good one.");
    return lines.join("\n");
  }

  for (const section of sections) {
    lines.push(`${section.heading}:`);
    for (const obligation of section.obligations) {
      lines.push(`  - ${obligation.title} - ${obligation.detail}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
