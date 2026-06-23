import { Building2, FolderOpen, Save, Trash2 } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { StatusPill } from "@/components/status-pill";
import { createProperty, deleteProperty, updateProperty } from "@/lib/actions/properties";
import { getDb } from "@/lib/db";
import { getAlphaUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const db = await getDb();
  const user = await getAlphaUser();
  const properties = await db.property.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="stack-xl">
      <SectionHeader title="Properties" />

      <section className="form-panel">
        <div className="panel-title">
          <Building2 size={18} />
          <h2>Add property</h2>
        </div>
        <form action={createProperty} className="form-grid">
          <Field label="Address" name="address" required />
          <Field label="Owner" name="ownerName" />
          <Field label="Tenant" name="tenantName" />
          <Field label="Filter size" name="filterSize" />
          <Field label="Drive folder URL" name="driveFolderUrl" />
          <Textarea label="Notes" name="notes" />
          <Textarea label="Utilities" name="utilityNotes" />
          <Textarea label="Codes" name="accessCodes" />
          <Textarea label="Appliances" name="applianceNotes" />
          <Textarea label="Warranty" name="warrantyNotes" />
          <Textarea label="HOA" name="hoaNotes" />
          <button className="primary-button" type="submit">
            <Save size={16} />
            Save property
          </button>
        </form>
      </section>

      <section className="content-section">
        <SectionHeader title="Property profiles" />
        <div className="record-grid">
          {properties.map((property) => (
            <article className="record-card" key={property.id}>
              <div className="record-card-header">
                <div>
                  <h3>{property.address}</h3>
                  <p>{property.tenantName || "No tenant on file"}</p>
                </div>
                <StatusPill tone={property.driveFolderUrl ? "success" : "neutral"}>
                  {property.driveFolderUrl ? "Drive linked" : "Local"}
                </StatusPill>
              </div>

              <form action={updateProperty} className="form-grid compact">
                <input name="id" type="hidden" value={property.id} />
                <Field label="Address" name="address" defaultValue={property.address} />
                <Field label="Owner" name="ownerName" defaultValue={property.ownerName} />
                <Field label="Tenant" name="tenantName" defaultValue={property.tenantName} />
                <Field label="Filter size" name="filterSize" defaultValue={property.filterSize} />
                <Field
                  label="Drive folder URL"
                  name="driveFolderUrl"
                  defaultValue={property.driveFolderUrl ?? ""}
                />
                <Textarea label="Notes" name="notes" defaultValue={property.notes} />
                <Textarea
                  label="Utilities"
                  name="utilityNotes"
                  defaultValue={property.utilityNotes}
                />
                <Textarea label="Codes" name="accessCodes" defaultValue={property.accessCodes} />
                <Textarea
                  label="Appliances"
                  name="applianceNotes"
                  defaultValue={property.applianceNotes}
                />
                <Textarea
                  label="Warranty"
                  name="warrantyNotes"
                  defaultValue={property.warrantyNotes}
                />
                <Textarea label="HOA" name="hoaNotes" defaultValue={property.hoaNotes} />
                <div className="button-row">
                  <button className="secondary-button" type="submit">
                    <Save size={16} />
                    Update
                  </button>
                </div>
              </form>

              <form action={deleteProperty}>
                <input name="id" type="hidden" value={property.id} />
                <button className="danger-button" type="submit">
                  <Trash2 size={16} />
                  Delete property
                </button>
              </form>

              {property.driveFolderUrl ? (
                <a className="inline-link" href={property.driveFolderUrl}>
                  <FolderOpen size={16} />
                  Open Drive folder
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
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
