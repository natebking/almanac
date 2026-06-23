import Link from "next/link";
import { Save, Trash2, UsersRound } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { StatusPill } from "@/components/status-pill";
import { createVendor, deleteVendor, updateVendor } from "@/lib/actions/vendors";
import { getDb } from "@/lib/db";
import { getAlphaUser } from "@/lib/session";
import {
  buildVendorDirectoryCards,
  type VendorDirectoryCard,
} from "@/lib/vendors/directory-cards";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const db = await getDb();
  const user = await getAlphaUser();
  const [vendors, properties, driveFiles] = await Promise.all([
    db.vendor.findMany({
      where: { userId: user.id },
      include: {
        propertyLinks: {
          include: { property: true, propertyIndex: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.propertyIndex.findMany({
      where: { userId: user.id },
      orderBy: { address: "asc" },
    }),
    db.driveFileIndex.findMany({
      where: {
        userId: user.id,
        propertyIndexId: { not: null },
        category: { in: ["financial", "maintenance", "project"] },
      },
      orderBy: { modifiedTime: "desc" },
    }),
  ]);
  const vendorCards = buildVendorDirectoryCards({ vendors, driveFiles });
  const vendorCardById = new Map(vendorCards.map((card) => [card.id, card]));

  return (
    <div className="stack-xl">
      <SectionHeader title="Vendors" />

      <section className="form-panel">
        <div className="panel-title">
          <UsersRound size={18} />
          <h2>Add vendor</h2>
        </div>
        <form action={createVendor} className="form-grid">
          <Field label="Name" name="name" required />
          <Field label="Trade" name="trade" />
          <Field label="Phone" name="phone" />
          <Field label="Email" name="email" />
          <Field label="License" name="licenseStatus" />
          <Field label="Insurance" name="insuranceStatus" />
          <Textarea label="Notes" name="notes" />
          <PropertyCheckboxes properties={properties} selectedIds={[]} />
          <button className="primary-button" type="submit">
            <Save size={16} />
            Save vendor
          </button>
        </form>
      </section>

      <section className="content-section">
        <SectionHeader title="Vendor directory" />
        <div className="record-grid">
          {vendors.map((vendor) => {
            const card = vendorCardById.get(vendor.id);

            return (
              <article className="record-card" id={vendor.id} key={vendor.id}>
                <div className="record-card-header">
                  <div>
                    <h3>{vendor.name}</h3>
                    <p>{vendor.trade}</p>
                  </div>
                  <StatusPill tone="info">
                    {vendor.propertyLinks.length} properties
                  </StatusPill>
                </div>
                {card ? <VendorSummary card={card} /> : null}
                <form action={updateVendor} className="form-grid compact">
                  <input name="id" type="hidden" value={vendor.id} />
                  <Field label="Name" name="name" defaultValue={vendor.name} />
                  <Field label="Trade" name="trade" defaultValue={vendor.trade} />
                  <Field label="Phone" name="phone" defaultValue={vendor.phone} />
                  <Field label="Email" name="email" defaultValue={vendor.email} />
                  <Field
                    label="License"
                    name="licenseStatus"
                    defaultValue={vendor.licenseStatus}
                  />
                  <Field
                    label="Insurance"
                    name="insuranceStatus"
                    defaultValue={vendor.insuranceStatus}
                  />
                  <Textarea label="Notes" name="notes" defaultValue={vendor.notes} />
                  <PropertyCheckboxes
                    properties={properties}
                    selectedIds={vendor.propertyLinks
                      .map((link) => link.propertyIndexId)
                      .filter((id): id is string => Boolean(id))}
                  />
                  <div className="button-row">
                    <button className="secondary-button" type="submit">
                      <Save size={16} />
                      Update
                    </button>
                  </div>
                </form>
                <form action={deleteVendor}>
                  <input name="id" type="hidden" value={vendor.id} />
                  <button className="danger-button" type="submit">
                    <Trash2 size={16} />
                    Delete vendor
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function VendorSummary({ card }: { card: VendorDirectoryCard }) {
  return (
    <div className="vendor-summary">
      <div className="button-row">
        <StatusPill tone={card.complianceTone}>{card.complianceLabel}</StatusPill>
        {card.contactActions.map((action) => (
          <a className="inline-link" href={action.href} key={action.href}>
            {action.label}
          </a>
        ))}
      </div>
      {card.notes ? <p>{card.notes}</p> : null}
      <div className="linked-list">
        {card.linkedProperties.map((property) => (
          <Link href={property.href} key={property.id}>
            {property.label}
          </Link>
        ))}
      </div>
      <div className="vendor-work">
        <strong>Related indexed work</strong>
        {card.relatedWork.length > 0 ? (
          <div className="list-panel">
            {card.relatedWork.map((item) => (
              <div className="data-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <a className="inline-link" href={item.href} target="_blank">
                  Open file
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No related work files indexed yet.</p>
        )}
      </div>
    </div>
  );
}

type IndexedPropertyOption = {
  id: string;
  address: string;
};

function PropertyCheckboxes({
  properties,
  selectedIds,
}: {
  properties: IndexedPropertyOption[];
  selectedIds: string[];
}) {
  return (
    <fieldset className="checkbox-field wide">
      <legend>Properties worked on</legend>
      <div className="checkbox-grid">
        {properties.map((property) => (
          <label key={property.id}>
            <input
              defaultChecked={selectedIds.includes(property.id)}
              name="propertyIndexIds"
              type="checkbox"
              value={property.id}
            />
            <span>{property.address}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  defaultValue = "",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input defaultValue={defaultValue} name={name} required={required} />
    </label>
  );
}

function Textarea({
  label,
  name,
  defaultValue = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <textarea defaultValue={defaultValue} name={name} rows={3} />
    </label>
  );
}
