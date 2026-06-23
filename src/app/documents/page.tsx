import { FileText, Printer, Save, Trash2 } from "lucide-react";
import { GeneratedDocumentActions } from "@/components/generated-document-actions";
import { SectionHeader } from "@/components/section-header";
import { StatusPill } from "@/components/status-pill";
import { createGeneratedDocument } from "@/lib/actions/generated-documents";
import { createTemplate, deleteTemplate } from "@/lib/actions/templates";
import { humanizePlaceholder, parseTemplatePlaceholders } from "@/lib/document-values";
import {
  buildGeneratedDocumentReview,
  type GeneratedDocumentReview,
} from "@/lib/documents/generated-review";
import {
  buildGeneratedDocumentQueue,
  type GeneratedDocumentQueueItem,
} from "@/lib/documents/generated-queue";
import { formatGeneratedDocumentError } from "@/lib/documents/errors";
import { buildDocumentReviewFields } from "@/lib/documents/review-fields";
import {
  isTemplateSelected,
  selectedPropertyForTemplate,
} from "@/lib/documents/selection";
import { getDb } from "@/lib/db";
import { getAlphaUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; property?: string; template?: string }>;
}) {
  const params = await searchParams;
  const db = await getDb();
  const user = await getAlphaUser();
  const [templates, properties, generatedDocuments] = await Promise.all([
    db.documentTemplate.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    db.propertyIndex.findMany({
      where: { userId: user.id },
      include: { profile: true },
      orderBy: { address: "asc" },
    }),
    db.generatedDocument.findMany({
      where: { userId: user.id },
      include: { property: true, propertyIndex: true, template: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  const generatedReview = buildGeneratedDocumentReview({
    documents: generatedDocuments,
    selectedGeneratedId: params.generated ?? "",
  });
  const generatedQueue = buildGeneratedDocumentQueue(generatedDocuments);

  return (
    <div className="stack-xl">
      <SectionHeader title="Documents" />

      {generatedReview ? <GeneratedDocumentReviewPanel review={generatedReview} /> : null}

      <GeneratedDocumentQueuePanel items={generatedQueue} />

      <section className="content-section">
        <SectionHeader title="Generate from template" />
        <div className="record-grid">
          {templates.map((template) => {
            const placeholders = parseTemplatePlaceholders(template.placeholders);
            const selected = isTemplateSelected({
              templateId: template.id,
              selectedTemplateId: params.template ?? "",
            });
            const selectedPropertyId = selectedPropertyForTemplate({
              templateId: template.id,
              selectedTemplateId: params.template ?? "",
              selectedPropertyId: params.property ?? "",
            });
            const selectedProperty = properties.find(
              (property) => property.id === selectedPropertyId,
            );
            const reviewFields = buildDocumentReviewFields({
              placeholders,
              property: selectedProperty ?? null,
            });

            return (
              <article
                className={selected ? "record-card active" : "record-card"}
                id={`template-${template.id}`}
                key={template.id}
              >
                <div className="record-card-header">
                  <div>
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                  </div>
                  <StatusPill tone={template.googleDocId ? "success" : "info"}>
                    {template.googleDocId ? "Google" : "Local"}
                  </StatusPill>
                </div>

                {selected && selectedProperty ? (
                  <div className="notice success">
                    Review prefilled fields for {selectedProperty.address}, edit if
                    needed, then generate.
                  </div>
                ) : null}

                <form action={createGeneratedDocument} className="form-grid compact">
                  <input name="templateId" type="hidden" value={template.id} />
                  <label className="field wide">
                    <span>Property</span>
                    <select
                      defaultValue={selectedPropertyId}
                      name="propertyIndexId"
                      required
                    >
                      <option value="">Choose property</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.address}
                        </option>
                      ))}
                    </select>
                  </label>

                  {reviewFields.map((field) => (
                    <label className="field" key={field.key}>
                      <span>{field.label}</span>
                      <input
                        defaultValue={field.defaultValue}
                        name={`field:${field.key}`}
                      />
                    </label>
                  ))}

                  <div className="button-row wide">
                    <button
                      className="primary-button"
                      name="redirectMode"
                      type="submit"
                      value="review"
                    >
                      <FileText size={16} />
                      Generate
                    </button>
                    <button
                      className="secondary-button"
                      name="redirectMode"
                      type="submit"
                      value="print"
                    >
                      <Printer size={16} />
                      Generate & print
                    </button>
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <Save size={18} />
          <h2>Add template</h2>
        </div>
        <form action={createTemplate} className="form-grid">
          <Field label="Template name" name="name" required />
          <Field label="Google Doc ID" name="googleDocId" />
          <Field label="Google Doc URL" name="googleDocUrl" />
          <Textarea label="Description" name="description" />
          <Textarea
            label="Template body"
            name="localBody"
            placeholder="Tenant: {{tenant_name}}"
            required
          />
          <button className="primary-button" type="submit">
            <Save size={16} />
            Save template
          </button>
        </form>
      </section>

      <section className="content-section">
        <SectionHeader title="Recent generated documents" />
        <div className="record-grid">
          {generatedDocuments.map((document) => (
            <GeneratedDocumentCard
              active={params.generated === document.id}
              document={document}
              key={document.id}
            />
          ))}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader title="Saved templates" />
        <div className="list-panel">
          {templates.map((template) => (
            <div className="data-row" key={template.id}>
              <div>
                <strong>{template.name}</strong>
                <p>
                  {parseTemplatePlaceholders(template.placeholders)
                    .map(humanizePlaceholder)
                    .join(", ") || "No placeholders"}
                </p>
              </div>
              <form action={deleteTemplate}>
                <input name="id" type="hidden" value={template.id} />
                <button
                  aria-label="Delete template"
                  className="icon-button danger-icon"
                  type="submit"
                >
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type GeneratedDocumentWithRelations = {
  id: string;
  title: string;
  status: string;
  renderedBody: string;
  pdfUrl: string | null;
  googleDocUrl: string | null;
  errorMessage: string | null;
  property: { address: string } | null;
  propertyIndex: { address: string } | null;
};

function GeneratedDocumentQueuePanel({
  items,
}: {
  items: GeneratedDocumentQueueItem[];
}) {
  return (
    <section className="content-section">
      <SectionHeader title="Ready to review / print" />
      <div className="list-panel">
        {items.map((item) => (
          <div className="data-row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.propertyAddress}</p>
            </div>
            <div className="button-row">
              <StatusPill tone="success">{item.status}</StatusPill>
              <GeneratedDocumentActions
                googleDocHref={item.googleDocHref}
                printHref={item.printHref}
                reviewHref={item.reviewHref}
              />
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="empty-state padded">No generated documents ready yet.</p>
        ) : null}
      </div>
    </section>
  );
}

function GeneratedDocumentCard({
  active,
  document,
}: {
  active: boolean;
  document: GeneratedDocumentWithRelations;
}) {
  const hasGoogleDoc = document.googleDocUrl?.startsWith("https://docs.google.com");
  const propertyAddress =
    document.propertyIndex?.address ?? document.property?.address ?? "Property";
  const errorMessage = formatGeneratedDocumentError(document.errorMessage);

  return (
    <article
      className={
        active
          ? "record-card generated-card active"
          : "record-card generated-card"
      }
    >
      <div className="record-card-header">
        <div>
          <h3>{document.title}</h3>
          <p>{propertyAddress}</p>
        </div>
        <StatusPill tone={document.status === "generated" ? "success" : "danger"}>
          {document.status}
        </StatusPill>
      </div>
      {errorMessage ? (
        <div className="notice danger">Generation failed: {errorMessage}</div>
      ) : null}
      <pre className="preview-box">{document.renderedBody}</pre>
      <GeneratedDocumentActions
        googleDocHref={hasGoogleDoc ? document.googleDocUrl : null}
        printHref={document.pdfUrl}
        reviewHref={`/documents?generated=${document.id}`}
      />
    </article>
  );
}

function GeneratedDocumentReviewPanel({
  review,
}: {
  review: GeneratedDocumentReview;
}) {
  return (
    <section className="generated-review-panel">
      <div className="record-card-header">
        <div>
          <p className="muted-label">Ready for review</p>
          <h2>{review.title}</h2>
          <p>{review.propertyAddress}</p>
        </div>
        <StatusPill tone={review.status === "generated" ? "success" : "danger"}>
          {review.status}
        </StatusPill>
      </div>
      {review.errorMessage ? (
        <div className="notice danger">Generation failed: {review.errorMessage}</div>
      ) : null}
      <pre className="preview-box">{review.renderedBody}</pre>
      <GeneratedDocumentActions
        googleDocHref={review.hasGoogleDoc ? review.googleDocUrl : null}
        printHref={review.pdfUrl}
        printPrimary
      />
    </section>
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
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <textarea
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={5}
      />
    </label>
  );
}
