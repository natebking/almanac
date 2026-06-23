import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ClipboardList,
  DollarSign,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Wrench,
} from "lucide-react";
import { GeneratedDocumentActions } from "@/components/generated-document-actions";
import { PropertyVisitRecorder } from "@/components/property-visit-recorder";
import { SectionHeader } from "@/components/section-header";
import { StatusPill } from "@/components/status-pill";
import { getDb } from "@/lib/db";
import { buildHouseGeneratedDocumentCards } from "@/lib/houses/generated-documents";
import {
  buildHouseQuickActions,
  type HouseQuickAction,
} from "@/lib/houses/quick-actions";
import { buildHouseProfileItems } from "@/lib/houses/profile-summary";
import { getHouse } from "@/lib/portfolio-data";
import { propertyPhotoForAddress } from "@/lib/property-photos";
import { getAlphaUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const quickActionIcons = {
  application: ClipboardList,
  "drive-folder": FolderOpen,
  financial: DollarSign,
  lease: FileText,
  maintenance: Wrench,
  "move-in-checklist": FileText,
  photos: ImageIcon,
};

export default async function HouseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAlphaUser();
  const db = await getDb();
  const [house, templates] = await Promise.all([
    getHouse(user.id, id),
    db.documentTemplate.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!house) {
    notFound();
  }
  const generatedDocuments = buildHouseGeneratedDocumentCards(house.generatedDocs);
  const profileItems = buildHouseProfileItems(house.profile);
  const photo = propertyPhotoForAddress(house.address);
  const quickActions = buildHouseQuickActions({
    propertyId: house.id,
    propertyAddress: house.address,
    driveFolderUrl: house.driveFolderUrl,
    driveFiles: house.driveFiles,
    templates,
  });

  return (
    <div className="stack-xl">
      <PropertyVisitRecorder propertyIndexId={house.id} />
      <section className="property-detail-hero">
        <div className="detail-hero-photo">
          <Image
            alt={photo.alt}
            fill
            loading="eager"
            sizes="(max-width: 900px) 100vw, 42vw"
            src={photo.src}
          />
          <StatusPill tone={house.status.toLowerCase().includes("vacant") ? "warning" : "success"}>
            {house.status}
          </StatusPill>
        </div>
        <div className="detail-hero-content">
          <div>
            <p className="muted-label">House</p>
            <h1>{house.address}</h1>
            <p>
              {house.currentTenants || "No current tenant listed in the spreadsheet."}
            </p>
          </div>
          <div className="detail-grid">
            <Field label="Rent" value={house.rentAmount || "Not listed"} />
            <Field label="Lease end" value={house.leaseEnd || "Not listed"} />
            <Field label="Tenant phone" value={house.tenantPhone || "Not listed"} />
          </div>
        </div>
      </section>

      <section className="content-section">
        <SectionHeader title="Spreadsheet facts" />
        <div className="detail-grid large">
          <Field label="Rent" value={house.rentAmount || "Not listed"} />
          <Field label="Lease start" value={house.leaseStart || "Not listed"} />
          <Field label="Lease end" value={house.leaseEnd || "Not listed"} />
          <Field label="Tenant phone" value={house.tenantPhone || "Not listed"} />
          <Field label="Tenant email" value={house.tenantEmail || "Not listed"} />
          <Field label="Tenant birthday(s)" value={house.tenantBirthdays || "Not listed"} />
          <Field label="Pets" value={house.pets || "Not listed"} />
          <Field label="Owner" value={house.owner || "Not listed"} />
          <Field label="Broker split" value={house.brokerSplit || "Not listed"} />
        </div>
        {house.tenantNotes ? <p className="notes-block">{house.tenantNotes}</p> : null}
      </section>

      <section className="content-section">
        <SectionHeader title="Property profile" />
        {profileItems.length > 0 ? (
          <div className="detail-grid large">
            {profileItems.map((item) => (
              <Field label={item.label} value={item.value} key={item.label} />
            ))}
          </div>
        ) : (
          <p className="empty-state padded">No profile details indexed yet.</p>
        )}
      </section>

      <section className="content-section">
        <SectionHeader title="Quick access" />
        <div className="quick-grid">
          {quickActions.map((action) => (
            <QuickActionButton action={action} key={action.key} />
          ))}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader
          action={<Link href="/documents">All documents</Link>}
          title="Generated documents"
        />
        <div className="list-panel">
          {generatedDocuments.map((doc) => (
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
          {generatedDocuments.length === 0 ? (
            <p className="empty-state padded">
              No generated documents for this house yet.
            </p>
          ) : null}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader title="Indexed Drive files" />
        <div className="list-panel">
          {house.driveFiles.map((file) => (
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

      <Link className="inline-link" href="/houses">
        Back to houses
      </Link>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function QuickActionButton({ action }: { action: HouseQuickAction }) {
  const Icon =
    quickActionIcons[action.key as keyof typeof quickActionIcons] ?? FileText;

  if (action.state === "fallback" && action.href) {
    return (
      <Link className="quick-action fallback" href={action.href}>
        <Icon size={18} />
        <span>{action.label}</span>
      </Link>
    );
  }

  if (action.state === "disabled" || !action.href) {
    return (
      <span className="quick-action disabled">
        <Icon size={18} />
        <span>{action.label}</span>
      </span>
    );
  }

  if (action.target === "_blank") {
    return (
      <a className="quick-action active" href={action.href} target="_blank">
        <Icon size={18} />
        <span>{action.label}</span>
      </a>
    );
  }

  return (
    <Link className="quick-action active" href={action.href}>
      <Icon size={18} />
      <span>{action.label}</span>
    </Link>
  );
}
