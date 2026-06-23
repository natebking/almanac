import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  FileText,
  Home,
  House,
  Search,
} from "lucide-react";
import { GeneratedDocumentActions } from "@/components/generated-document-actions";
import { SectionHeader } from "@/components/section-header";
import { StatusPill } from "@/components/status-pill";
import { getDashboardData } from "@/lib/portfolio-data";
import { getAlphaUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await getAlphaUser();
  const {
    attentionItems,
    leaseExpirations,
    projects,
    properties,
    recentConversations,
    recentFiles,
    recentGeneratedDocuments,
    recentProperties,
    vacantProperties,
  } = await getDashboardData(user.id);
  const greetingName = firstName(user.name ?? user.email ?? "operator");
  const occupiedCount = properties.length - vacantProperties.length;
  const monthlyRentRoll = properties.reduce(
    (sum, property) => sum + parseRentAmount(property.rentAmount),
    0,
  );
  const occupancyPercent =
    properties.length > 0 ? Math.round((occupiedCount / properties.length) * 100) : 0;

  return (
    <div className="stack-xl">
      <section className="dashboard-hero">
        <div className="dashboard-masthead">
          <div>
            <p>Good morning,</p>
            <h1>{greetingName}</h1>
          </div>
          <div className="dashboard-masthead-actions">
            <Link className="primary-button" href="/assistant">
              <Bot size={18} />
              Ask AI
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="dashboard-rent-card">
          <p>Monthly rent roll</p>
          <strong>{formatCurrency(monthlyRentRoll)}</strong>
          <div className="dashboard-progress" aria-label={`${occupancyPercent}% occupied`}>
            <span style={{ width: `${occupancyPercent}%` }} />
          </div>
          <small>
            {occupancyPercent}% occupied - {vacantProperties.length} vacant
          </small>
        </div>
      </section>

      <section className="workflow-action-grid" aria-label="Common workflows">
        <Link className="workflow-action primary" href="/documents">
          <FileText size={20} />
          <span>
            <strong>Generate</strong>
            <small>Template or PDF</small>
          </span>
        </Link>
        <Link className="workflow-action" href="/houses">
          <House size={20} />
          <span>
            <strong>Open house</strong>
            <small>Tenant, lease, Drive</small>
          </span>
        </Link>
        <Link className="workflow-action" href="/search">
          <Search size={20} />
          <span>
            <strong>Search</strong>
            <small>Drive and sheet</small>
          </span>
        </Link>
      </section>

      <section className="content-section">
        <SectionHeader
          action={<Link href="/radar">Open radar</Link>}
          title="Needs attention"
        />
        <div className="list-panel">
          {attentionItems.map((item) => (
            <div className="data-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </div>
              <div className="button-row">
                <StatusPill tone={item.tone}>{item.label}</StatusPill>
                {item.href.startsWith("http") ? (
                  <a className="inline-link" href={item.href} target="_blank">
                    Open
                  </a>
                ) : (
                  <Link className="inline-link" href={item.href}>
                    Open
                  </Link>
                )}
              </div>
            </div>
          ))}
          {attentionItems.length === 0 ? (
            <p className="empty-state padded">Nothing needs attention right now.</p>
          ) : null}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader
          action={<Link href="/documents">All templates</Link>}
          title="Recent generated documents"
        />
        <div className="list-panel">
          {recentGeneratedDocuments.map((doc) => (
            <div className="data-row" key={doc.id}>
              <div>
                <strong>{doc.title}</strong>
                <p>{doc.propertyAddress}</p>
              </div>
              <div className="button-row">
                <StatusPill tone={doc.tone}>{doc.status}</StatusPill>
                <GeneratedDocumentActions
                  googleDocHref={doc.googleDocHref}
                  printHref={doc.printHref}
                  reviewHref={doc.reviewHref}
                />
              </div>
            </div>
          ))}
          {recentGeneratedDocuments.length === 0 ? (
            <p className="empty-state padded">No generated documents yet.</p>
          ) : null}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader
          action={<Link href="/houses">All houses</Link>}
          title="Recently opened properties"
        />
        <div className="list-panel">
          {recentProperties.map((property) => (
            <div className="data-row" key={property.id}>
              <div>
                <strong>{property.title}</strong>
                <p>
                  {property.subtitle} - opened {formatDate(property.openedAt)}
                </p>
              </div>
              <div className="button-row">
                <StatusPill tone={property.tone}>{property.status}</StatusPill>
                <Link className="inline-link" href={property.href}>
                  Open
                </Link>
              </div>
            </div>
          ))}
          {recentProperties.length === 0 ? (
            <p className="empty-state padded">
              Open a house and it will appear here.
            </p>
          ) : null}
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric-card primary">
          <span>{properties.length}</span>
          <p>Indexed houses</p>
          <Home size={18} />
        </div>
        <div className="metric-card">
          <CalendarClock size={18} />
          <span>{leaseExpirations.length}</span>
          <p>Leases within 90 days</p>
        </div>
        <div className="metric-card">
          <Home size={18} />
          <span>{vacantProperties.length}</span>
          <p>Vacant properties</p>
        </div>
        <div className="metric-card">
          <BriefcaseBusiness size={18} />
          <span>{projects.length}</span>
          <p>Active projects</p>
        </div>
      </section>

      <section className="content-section">
        <SectionHeader
          action={<Link href="/projects">Open projects</Link>}
          title="Active projects"
        />
        <div className="list-panel">
          {projects.map((project) => (
            <div className="data-row" key={project.id}>
              <div>
                <strong>{project.name}</strong>
                <p>{project.propertyIndex?.address ?? "General"}</p>
              </div>
              <a className="inline-link" href={project.webViewLink} target="_blank">
                Open
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader title="Recent Drive files" action={<Link href="/search">Search</Link>} />
        <div className="list-panel">
          {recentFiles.map((file) => (
            <div className="data-row" key={file.id}>
              <div>
                <strong>{file.name}</strong>
                <p>{file.category}</p>
              </div>
              <a className="inline-link" href={file.webViewLink} target="_blank">
                Open
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader
          action={<Link href="/assistant">Ask AI</Link>}
          title="Recent AI conversations"
        />
        <div className="list-panel">
          {recentConversations.map((conversation) => (
            <div className="data-row" key={conversation.id}>
              <div>
                <strong>{conversation.title}</strong>
                <p>{formatDate(conversation.updatedAt)}</p>
              </div>
              <Link
                className="inline-link"
                href={`/assistant?conversation=${conversation.id}`}
              >
                Open
              </Link>
            </div>
          ))}
          {recentConversations.length === 0 ? (
            <p className="empty-state padded">No saved assistant conversations yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function parseRentAmount(value: string): number {
  const parsed = Number(value.replace(/[$,]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function firstName(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "operator";
  }

  return trimmed.split(/\s+/)[0];
}

