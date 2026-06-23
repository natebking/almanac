import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FolderOpen } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { getDb } from "@/lib/db";
import { getPortfolioSources } from "@/lib/portfolio-data";
import { propertyPhotoForAddress } from "@/lib/property-photos";
import { getAlphaUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HousesPage() {
  const db = await getDb();
  const user = await getAlphaUser();
  const [houses, sources] = await Promise.all([
    db.propertyIndex.findMany({
      where: { userId: user.id },
      include: { driveFiles: true },
      orderBy: { address: "asc" },
    }),
    getPortfolioSources(user.id),
  ]);
  const spreadsheet = sources.find((source) => source.kind === "master-spreadsheet");

  return (
    <div className="stack-xl">
      <section className="source-banner">
        <div>
          <p className="muted-label">Spreadsheet source</p>
          <h1>Houses</h1>
          <p>
            Property data is indexed from {spreadsheet?.name ?? "the master spreadsheet"}.
            Google Drive remains the file source.
          </p>
        </div>
        {spreadsheet?.googleFileUrl ? (
          <a className="secondary-button" href={spreadsheet.googleFileUrl} target="_blank">
            <FolderOpen size={16} />
            Open sheet
          </a>
        ) : null}
      </section>

      <section className="record-grid">
        {houses.map((house, index) => {
          const photo = propertyPhotoForAddress(house.address);

          return (
            <article className="record-card property-card" key={house.id}>
              <div className="property-photo">
                <Image
                  alt={photo.alt}
                  fill
                  loading={index < 2 ? "eager" : "lazy"}
                  sizes="(max-width: 900px) 100vw, 50vw"
                  src={photo.src}
                />
                <StatusPill tone={house.status.toLowerCase().includes("vacant") ? "warning" : "success"}>
                  {house.status}
                </StatusPill>
              </div>
              <div className="property-card-body">
                <div className="record-card-header">
                  <div>
                    <h3>{house.address}</h3>
                    <p>{house.currentTenants || "No current tenant"}</p>
                  </div>
                  <div className="rent-stack">
                    <strong>{formatRent(house.rentAmount)}</strong>
                    <span>{house.status.toLowerCase().includes("vacant") ? "listed" : "per month"}</span>
                  </div>
                </div>
                <div className="tenant-row">
                  <span className="avatar-badge small">
                    {initials(house.currentTenants || house.address)}
                  </span>
                  <div>
                    <strong>{house.currentTenants || "Vacant"}</strong>
                    <p>{house.leaseEnd ? `Lease ends ${house.leaseEnd}` : "Lease not listed"}</p>
                  </div>
                </div>
                <div className="detail-grid">
                  <Field label="Phone" value={house.tenantPhone || "Not listed"} />
                  <Field label="Drive files" value={String(house.driveFiles.length)} />
                </div>
                <Link className="primary-button" href={`/houses/${house.id}`}>
                  Open house
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </section>
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

function formatRent(value: string): string {
  const parsed = Number(value.replace(/[$,]/g, ""));

  if (!Number.isFinite(parsed) || parsed === 0) {
    return "$0";
  }

  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(parsed);
}

function initials(value: string): string {
  const [first = "", second = ""] = value.trim().split(/\s+/);
  const result = `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();

  return result || "HC";
}
