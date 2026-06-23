import Link from "next/link";
import { Bell } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { StatusPill } from "@/components/status-pill";
import { getDashboardData } from "@/lib/portfolio-data";
import { getAlphaUser } from "@/lib/session";
import { buildWeeklyDigest } from "@/lib/radar/digest";
import {
  buildRadarObligations,
  type RadarObligation,
  type RadarUrgency,
} from "@/lib/radar/obligations";

export const dynamic = "force-dynamic";

const urgencyMeta: Record<
  RadarUrgency,
  { tone: "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  "this-week": { tone: "danger", label: "This week" },
  ongoing: { tone: "info", label: "Ongoing" },
  soon: { tone: "warning", label: "Soon" },
  upcoming: { tone: "neutral", label: "Upcoming" },
};

export default async function RadarPage() {
  const user = await getAlphaUser();
  const today = new Date();
  const { properties } = await getDashboardData(user.id, today);
  const obligations = buildRadarObligations({ today, properties });
  const digest = buildWeeklyDigest({ today, obligations });

  return (
    <div className="stack-xl">
      <section className="source-banner">
        <div>
          <p className="muted-label">Obligation radar</p>
          <h1>What you need to stay ahead of</h1>
          <p>
            Pulled from your master spreadsheet: lease renewals, move-ins,
            vacancies, and tenant birthdays, ranked by urgency. Nothing here is
            invented - every item links back to its property record.
          </p>
        </div>
        <Bell size={34} />
      </section>

      <section className="content-section">
        <SectionHeader
          action={
            <span className="muted-label">
              {deliveryLabel(digest.itemCount)}
            </span>
          }
          title={digest.subject}
        />
        <div className="list-panel">
          {digest.sections.map((section) => (
            <div className="data-row" key={section.kind}>
              <div>
                <strong>{section.heading}</strong>
                <p>
                  {section.obligations
                    .map((obligation) => obligation.title)
                    .join(" - ")}
                </p>
              </div>
              <StatusPill tone="neutral">{section.obligations.length}</StatusPill>
            </div>
          ))}
          {digest.itemCount === 0 ? (
            <p className="empty-state padded">
              Nothing time-sensitive in the next week.
            </p>
          ) : null}
        </div>
        <p className="muted-label" style={{ marginTop: 12 }}>
          This is the weekly digest. Delivery is in-app for now; connect a free
          email sender to have it pushed every week.
        </p>
      </section>

      <section className="content-section">
        <SectionHeader title="All upcoming obligations" />
        <div className="list-panel">
          {obligations.map((obligation) => (
            <ObligationRow key={obligation.id} obligation={obligation} />
          ))}
          {obligations.length === 0 ? (
            <p className="empty-state padded">
              No upcoming obligations in your indexed records.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ObligationRow({ obligation }: { obligation: RadarObligation }) {
  const meta = urgencyMeta[obligation.urgency];

  return (
    <div className="data-row">
      <div>
        <strong>{obligation.title}</strong>
        <p>{obligation.detail}</p>
      </div>
      <div className="button-row">
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        <Link className="inline-link" href={obligation.href}>
          Open
        </Link>
      </div>
    </div>
  );
}

function deliveryLabel(itemCount: number): string {
  if (itemCount === 0) {
    return "In-app digest";
  }

  return `${itemCount} this week`;
}
