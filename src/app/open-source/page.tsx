import type { Metadata } from "next";
import type { ComponentType } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  FolderGit2,
  Lock,
  Quote,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { propertyPhotoForAddress } from "@/lib/property-photos";

// Public repository URL. Replace with the real GitHub URL when the repo goes
// public; it is the single source for every "View on GitHub" link on the page.
const GITHUB_URL = "https://github.com/natebking/almanac";

export const metadata: Metadata = {
  title: "Almanac | Property operations on Google Drive",
  description:
    "Almanac is an open-source, self-hosted property operations front end for teams already running on Google Drive and Sheets. It flags what needs attention, answers from your real records with citations, and never moves your files out of Drive.",
};

const landingProperties = [
  {
    address: "Boardwalk",
    files: "Lease, photos, checklist",
    lease: "Dec 31, 2026",
    rent: "$2,450",
    status: "Occupied",
    tenant: "Avery Johnson",
  },
  {
    address: "Park Place",
    files: "Application, lease",
    lease: "Mar 14, 2027",
    rent: "$2,850",
    status: "Occupied",
    tenant: "Mia Chen",
  },
  {
    address: "Marvin Gardens",
    files: "Lease, inspection",
    lease: "Aug 31, 2026",
    rent: "$2,300",
    status: "Renewal soon",
    tenant: "Jordan Lee",
  },
  {
    address: "Baltic Avenue",
    files: "Photos, remodel scope",
    lease: "Vacant",
    rent: "$0",
    status: "Vacant",
    tenant: "Turnover",
  },
  {
    address: "Pennsylvania Avenue",
    files: "Warranty, owner update",
    lease: "Jan 31, 2027",
    rent: "$3,150",
    status: "Occupied",
    tenant: "Olivia Martin",
  },
];

type Pillar = {
  icon: ComponentType<{ size?: number }>;
  eyebrow: string;
  title: string;
  copy: string;
};

const pillars: Pillar[] = [
  {
    icon: Bell,
    eyebrow: "Stay ahead",
    title: "See what needs attention",
    copy: "Lease renewals, upcoming move-ins, and vacancies are pulled from your master spreadsheet and ranked by urgency, so nothing time-sensitive slips past you.",
  },
  {
    icon: Quote,
    eyebrow: "Trust the answer",
    title: "Answers it can't fake",
    copy: "Ask about any property and get an answer drawn only from your indexed records. Every claim links to its source, and anything it can't ground, it refuses to invent.",
  },
  {
    icon: FileText,
    eyebrow: "Get work done",
    title: "Documents from your own templates",
    copy: "Fill your existing Google Docs templates with property data, review the draft, then open the live doc or a printable view. Your original templates are never edited.",
  },
];

const privacyPoints = [
  {
    icon: Database,
    title: "An index, not a second vault",
    copy: "Almanac stores spreadsheet rows and Drive metadata in a local cache it can rebuild any time. It never becomes a duplicate copy of your documents.",
  },
  {
    icon: ShieldCheck,
    title: "Drive and Sheets stay the source of truth",
    copy: "Files live in your Google Drive exactly as they do today. Open any record and you jump straight back to the real file.",
  },
  {
    icon: Lock,
    title: "Test before you connect anything real",
    copy: "Start on seeded sample data, then point at a single safe Drive folder. Connect live tenant and owner records only when you are ready.",
  },
];

const setupSteps = [
  "Run the local demo with SQLite and seeded sample records — no Google account needed.",
  "Deploy privately to your own Vercel, Postgres, and login provider.",
  "Connect your Google Drive, Docs, and Sheets from the settings page.",
  "Sync a safe test folder before pointing Almanac at live records.",
];

export default function OpenSourceLandingPage() {
  return (
    <main className="public-landing">
      <header className="public-nav" aria-label="Public navigation">
        <a className="public-brand" href="#top">
          <span aria-hidden="true" className="public-brand-mark" />
          <span>Almanac</span>
        </a>
        <div className="public-nav-actions">
          <nav aria-label="Sections">
            <a href="#product">What it does</a>
            <a href="#privacy">Privacy</a>
            <a href="#self-host">Self-host</a>
          </nav>
          <a
            className="public-github-link"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
          >
            <FolderGit2 size={16} />
            GitHub
          </a>
        </div>
      </header>

      <section className="public-hero" id="top">
        <div className="public-hero-copy">
          <span className="public-kicker">
            Open source · Self-hosted · Google-native
          </span>
          <h1>Property operations for teams already running on Google Drive.</h1>
          <p className="public-lede">
            Almanac turns the Google Sheet and Drive folders you already use
            into a property command center. It surfaces what needs attention,
            answers from your real records with citations, and never moves your
            files into another system.
          </p>
          <div className="public-actions">
            <a
              className="public-primary-button"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
            >
              <FolderGit2 size={18} />
              View on GitHub
              <ArrowRight size={17} />
            </a>
            <a
              className="public-secondary-button"
              href="https://demo.almanac.homes"
              target="_blank"
              rel="noreferrer"
            >
              Try the live demo
            </a>
          </div>
          <dl className="public-proof-strip" aria-label="Product proof points">
            <div>
              <dt>No migration</dt>
              <dd>Drive and Sheets stay the source of truth</dd>
            </div>
            <div>
              <dt>Source-grounded</dt>
              <dd>Every answer cites the record it came from</dd>
            </div>
            <div>
              <dt>Self-hosted</dt>
              <dd>Local demo first, your own cloud when ready</dd>
            </div>
          </dl>
        </div>

        <ProductHeroPreview />
      </section>

      <section className="public-section" id="product">
        <div className="public-section-heading">
          <h2>The work property teams repeat every week, in one place.</h2>
          <p>
            Most small teams already have a system — a master spreadsheet and a
            pile of Drive folders. Almanac makes that system fast to use
            instead of replacing it.
          </p>
        </div>
        <div className="public-pillar-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article className="public-pillar" key={pillar.title}>
                <span className="public-pillar-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="public-pillar-eyebrow">{pillar.eyebrow}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="public-section public-photo-section">
        <div className="public-section-heading">
          <h2>Every record starts with the property, not a folder tree.</h2>
          <p>
            The demo portfolio uses safe sample records and sample exterior
            photos, so you can inspect the whole workflow without touching real
            tenant, owner, or financial data.
          </p>
        </div>
        <div className="public-property-strip" aria-label="Sample property records">
          {landingProperties.map((property) => (
            <PropertyPhotoCard property={property} key={property.address} />
          ))}
        </div>
      </section>

      <section className="public-band" id="privacy">
        <div className="public-section-heading">
          <h2>Your files never leave Google Drive.</h2>
          <p>
            The whole point of Almanac is to give your existing setup a
            front end — not to ask you to trust a new document vault.
          </p>
        </div>
        <div className="public-privacy-grid">
          {privacyPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div className="public-privacy-card" key={point.title}>
                <Icon size={20} />
                <strong>{point.title}</strong>
                <span>{point.copy}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="public-section public-two-column" id="ai-setup">
        <div className="public-section-heading">
          <span className="public-kicker">For builders</span>
          <h2>Set it up with your AI coding assistant.</h2>
          <p>
            Almanac ships with a handoff guide written for coding assistants
            like Claude and Codex. Clone the repo, hand your assistant the
            guide, and let it stand up the local demo and walk you through
            connecting Google — no migration project, no vendor lock-in.
          </p>
          <a
            className="public-secondary-button"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
          >
            <FolderGit2 size={17} />
            Read the handoff guide
          </a>
        </div>
        <div className="public-ai-card" aria-hidden="true">
          <div className="public-ai-card-head">
            <Terminal size={16} />
            <span>your-assistant</span>
          </div>
          <p>
            <span className="public-ai-prompt">you</span> Set up Almanac
            locally from this repo.
          </p>
          <p className="public-ai-reply">
            <Bot size={15} /> Cloning, installing dependencies, seeding the
            demo database, and starting the dev server…
          </p>
          <p className="public-ai-reply ok">
            <CheckCircle2 size={15} /> Demo running at localhost:3000 with sample
            properties.
          </p>
        </div>
      </section>

      <section className="public-band" id="self-host">
        <div className="public-section-heading">
          <h2>Start with a local demo. Connect live records only when ready.</h2>
          <p>
            Bring your own Google, login provider, database, and host. Nothing
            here requires a paid account to try.
          </p>
        </div>
        <div className="public-setup-list">
          {setupSteps.map((step, index) => (
            <div className="public-setup-row" key={step}>
              <span className="public-setup-index" aria-hidden="true">
                {index + 1}
              </span>
              <CheckCircle2 size={18} />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="public-cta">
        <div>
          <h2>Run it locally, then decide what to connect.</h2>
          <p>
            Inspect the whole product on sample data before anyone grants Google
            access or uploads a single real business record.
          </p>
          <div className="public-actions">
            <a
              className="public-primary-button"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
            >
              <FolderGit2 size={18} />
              View on GitHub
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
        <div className="public-code-card">
          <span>Local demo</span>
          <code>git clone {GITHUB_URL}</code>
          <code>npm install</code>
          <code>cp .env.example .env</code>
          <code>npm run db:init</code>
          <code>npm run dev</code>
        </div>
      </section>

      <footer className="public-footer">
        <div className="public-footer-brand">
          <span className="public-brand">
            <span aria-hidden="true" className="public-brand-mark" />
            <span>Almanac</span>
          </span>
          <p>
            An open-source property operations front end for teams already
            running on Google Drive and Sheets.
          </p>
        </div>
        <nav className="public-footer-links" aria-label="Footer">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            <FolderGit2 size={15} />
            GitHub
          </a>
          <a href="#self-host">Self-host guide</a>
          <a href="#privacy">Privacy model</a>
          <a href={`${GITHUB_URL}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer">
            Security
          </a>
          <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            MIT License
          </a>
        </nav>
        <p className="public-footer-note">
          All records, names, owners, vendors, and Google links shown here are
          sample data. Replace them only in your own private environment.
        </p>
        <p className="public-footer-note">
          Built by{" "}
          <a href="https://natebking.com" target="_blank" rel="noreferrer">
            Nate King
          </a>{" "}
          ·{" "}
          <a href="mailto:nate@natebking.com">nate@natebking.com</a>{" "}
          ·{" "}
          <a href="https://github.com/natebking" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}

function ProductHeroPreview() {
  const featured = landingProperties[0];
  const photo = propertyPhotoForAddress(featured.address);

  return (
    <div className="public-product-shot" aria-label="Almanac product preview">
      <div className="public-device-shell">
        <div className="public-device-bar">
          <span />
          <span />
          <span />
        </div>
        <div className="public-product-dashboard">
          <div className="public-dashboard-sidebar">
            <strong>Almanac</strong>
            <span>Today</span>
            <span>Houses</span>
            <span>Search</span>
            <span>Documents</span>
          </div>
          <div className="public-dashboard-main">
            <div className="public-dashboard-topline">
              <div>
                <small>Needs attention</small>
                <strong>3 items this week</strong>
              </div>
              <button type="button">Ask AI</button>
            </div>
            <div className="public-dashboard-attention">
              <span className="public-dot warning" />
              <div>
                <strong>Marvin Gardens lease expires</strong>
                <small>in 86 days</small>
              </div>
              <span className="public-dashboard-pill">Lease</span>
            </div>
            <div className="public-dashboard-house">
              <Image
                alt={photo.alt}
                fill
                loading="eager"
                sizes="520px"
                src={photo.src}
              />
              <div>
                <strong>{featured.address}</strong>
                <span>
                  {featured.tenant} · {featured.rent}
                </span>
              </div>
            </div>
            <div className="public-dashboard-answer">
              <Bot size={15} />
              <div>
                <strong>Mia Chen lives at Park Place.</strong>
                <small>Source: master spreadsheet row</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyPhotoCard({
  property,
}: {
  property: (typeof landingProperties)[number];
}) {
  const photo = propertyPhotoForAddress(property.address);

  return (
    <article className="public-property-card">
      <div className="public-property-image">
        <Image alt={photo.alt} fill sizes="(max-width: 900px) 80vw, 260px" src={photo.src} />
        <span>{property.status}</span>
      </div>
      <div>
        <h3>{property.address}</h3>
        <p>{property.tenant}</p>
      </div>
      <dl>
        <div>
          <dt>Rent</dt>
          <dd>{property.rent}</dd>
        </div>
        <div>
          <dt>Lease</dt>
          <dd>{property.lease}</dd>
        </div>
      </dl>
    </article>
  );
}
