// Obligation radar: surfaces the dated, time-sensitive things an operator is
// about to forget, pulled straight from the indexed master spreadsheet. It uses
// only fields that genuinely carry a date or state (lease end, lease start,
// status, tenant birthdays) so it never invents an obligation.

export type RadarObligationKind =
  | "lease-expiry"
  | "move-in"
  | "vacancy"
  | "birthday";

export type RadarUrgency = "this-week" | "ongoing" | "soon" | "upcoming";

export type RadarObligation = {
  id: string;
  kind: RadarObligationKind;
  title: string;
  detail: string;
  href: string;
  /** ISO date (YYYY-MM-DD) the item is due, or null for ongoing states. */
  dueDate: string | null;
  /** Whole days from `today` until `dueDate`, or null for ongoing states. */
  daysUntil: number | null;
  urgency: RadarUrgency;
  /** Lower sorts first. */
  priority: number;
};

export type RadarProperty = {
  id: string;
  address: string;
  leaseStart: string;
  leaseEnd: string;
  status: string;
  tenantBirthdays: string;
  currentTenants: string;
  tenantNotes: string;
};

const LEASE_HORIZON_DAYS = 90;
const MOVE_IN_HORIZON_DAYS = 30;
const BIRTHDAY_HORIZON_DAYS = 31;

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export function buildRadarObligations(input: {
  today: Date;
  properties: RadarProperty[];
}): RadarObligation[] {
  const obligations = input.properties.flatMap((property) => [
    ...leaseExpiryObligation(property, input.today),
    ...moveInObligation(property, input.today),
    ...vacancyObligation(property),
    ...birthdayObligations(property, input.today),
  ]);

  return obligations.sort(
    (left, right) =>
      left.priority - right.priority || left.title.localeCompare(right.title),
  );
}

function leaseExpiryObligation(
  property: RadarProperty,
  today: Date,
): RadarObligation[] {
  const days = daysUntilDate(property.leaseEnd, today);

  if (days === null || days < 0 || days > LEASE_HORIZON_DAYS) {
    return [];
  }

  const tenant = property.currentTenants || "Tenant";

  return [
    {
      id: `lease-${property.id}`,
      kind: "lease-expiry",
      title: `${property.address} lease expires`,
      detail: `${tenant} - ${property.leaseEnd} (${formatDays(days)})`,
      href: `/houses/${property.id}`,
      dueDate: property.leaseEnd,
      daysUntil: days,
      ...urgencyFor(days),
    },
  ];
}

function moveInObligation(
  property: RadarProperty,
  today: Date,
): RadarObligation[] {
  const days = daysUntilDate(property.leaseStart, today);

  if (days === null || days < 0 || days > MOVE_IN_HORIZON_DAYS) {
    return [];
  }

  const tenant = property.currentTenants || "New tenant";

  return [
    {
      id: `move-in-${property.id}`,
      kind: "move-in",
      title: `${property.address} move-in`,
      detail: `${tenant} - ${property.leaseStart} (${formatDays(days)})`,
      href: `/houses/${property.id}`,
      dueDate: property.leaseStart,
      daysUntil: days,
      ...urgencyFor(days),
    },
  ];
}

function vacancyObligation(property: RadarProperty): RadarObligation[] {
  if (!property.status.toLowerCase().includes("vacant")) {
    return [];
  }

  return [
    {
      id: `vacancy-${property.id}`,
      kind: "vacancy",
      title: `${property.address} is vacant`,
      detail: property.tenantNotes || "No tenant listed - follow up on turnover.",
      href: `/houses/${property.id}`,
      dueDate: null,
      daysUntil: null,
      urgency: "ongoing",
      priority: 8,
    },
  ];
}

function birthdayObligations(
  property: RadarProperty,
  today: Date,
): RadarObligation[] {
  return parseBirthdays(property.tenantBirthdays).flatMap((birthday, index) => {
    const days = daysUntilMonthDay(birthday.month, birthday.day, today);

    if (days === null || days > BIRTHDAY_HORIZON_DAYS) {
      return [];
    }

    return [
      {
        id: `birthday-${property.id}-${index}`,
        kind: "birthday" as const,
        title: `Tenant birthday at ${property.address}`,
        detail: `${birthday.label} (${formatDays(days)})`,
        href: `/houses/${property.id}`,
        dueDate: null,
        daysUntil: days,
        ...urgencyFor(days),
      },
    ];
  });
}

function urgencyFor(days: number): { urgency: RadarUrgency; priority: number } {
  if (days <= 7) {
    return { urgency: "this-week", priority: days };
  }
  if (days <= 30) {
    return { urgency: "soon", priority: 10 + days };
  }
  return { urgency: "upcoming", priority: 100 + days };
}

function parseBirthdays(
  value: string,
): { month: number; day: number; label: string }[] {
  if (!value) {
    return [];
  }

  const matches = value.matchAll(/([A-Za-z]+)\s+(\d{1,2})/g);
  const results: { month: number; day: number; label: string }[] = [];

  for (const match of matches) {
    const month = MONTHS[match[1].toLowerCase()];
    const day = Number(match[2]);

    if (month === undefined || day < 1 || day > 31) {
      continue;
    }

    results.push({ month, day, label: `${match[1]} ${day}` });
  }

  return results;
}

function daysUntilDate(dateText: string, today: Date): number | null {
  if (!dateText) {
    return null;
  }

  const date = new Date(`${dateText}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return diffInDays(startOfUtcDay(today), date);
}

function daysUntilMonthDay(
  month: number,
  day: number,
  today: Date,
): number | null {
  const start = startOfUtcDay(today);
  const year = start.getUTCFullYear();
  let next = new Date(Date.UTC(year, month, day));

  if (diffInDays(start, next) < 0) {
    next = new Date(Date.UTC(year + 1, month, day));
  }

  const days = diffInDays(start, next);

  return Number.isNaN(days) ? null : days;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function diffInDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function formatDays(days: number): string {
  if (days === 0) {
    return "today";
  }

  return `in ${days} ${days === 1 ? "day" : "days"}`;
}
