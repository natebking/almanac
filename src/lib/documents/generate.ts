import {
  buildDocumentFieldValues,
  type DocumentPropertySource,
  type FieldValues,
  parseTemplatePlaceholders,
} from "@/lib/document-values";
import { getDb } from "@/lib/db";
import { generatedDocumentErrorMessage } from "@/lib/documents/errors";
import { getEnv } from "@/lib/env";
import { getAuthorizedOAuthClient } from "@/lib/google/oauth";
import { RealGoogleWorkspaceAdapter } from "@/lib/google/real-adapter";
import { renderLocalDocument } from "@/lib/sample-documents";

export type GenerateDocumentInput = {
  userId: string;
  templateId: string;
  propertyId?: string;
  propertyIndexId?: string;
  values: FieldValues;
};

export async function generateDocumentForUser(input: GenerateDocumentInput) {
  const db = await getDb();

  const [template, propertyIndex, localProperty] = await Promise.all([
    db.documentTemplate.findFirst({
      where: { id: input.templateId, userId: input.userId },
    }),
    input.propertyIndexId
      ? db.propertyIndex.findFirst({
          where: { id: input.propertyIndexId, userId: input.userId },
          include: { profile: true },
        })
      : Promise.resolve(null),
    input.propertyId
      ? db.property.findFirst({
          where: { id: input.propertyId, userId: input.userId },
        })
      : Promise.resolve(null),
  ]);
  const property = (propertyIndex ?? localProperty) as DocumentPropertySource | null;

  if (!template) {
    throw new Error("Template not found.");
  }

  if (!property) {
    throw new Error("Property not found.");
  }

  const placeholders = parseTemplatePlaceholders(template.placeholders);
  const fieldValues = buildDocumentFieldValues({
    placeholders,
    property,
    submittedValues: input.values,
  });
  const rendered = renderLocalDocument({
    templateName: template.name,
    propertyAddress: property.address,
    body: template.localBody,
    values: fieldValues,
  });
  let googleDocId: string | null = null;
  let googleDocUrl: string | null = null;
  let status = "generated";
  let generationError: string | null = null;
  const shouldCreateGoogleDocument =
    getEnv().GOOGLE_MODE === "real" && Boolean(template.googleDocId);

  if (shouldCreateGoogleDocument && !property.driveFolderId) {
    status = "error";
    generationError = `Property Drive folder missing for ${property.address}.`;
  } else if (shouldCreateGoogleDocument && template.googleDocId) {
    try {
      const { client } = await getAuthorizedOAuthClient(input.userId);
      const adapter = new RealGoogleWorkspaceAdapter(client);
      const googleDocument = await adapter.generateDocument({
        templateDocId: template.googleDocId,
        title: rendered.title,
        folderId: property.driveFolderId,
        values: fieldValues,
      });
      googleDocId = googleDocument.googleDocId;
      googleDocUrl = googleDocument.googleDocUrl;
    } catch (error) {
      status = "error";
      generationError = generatedDocumentErrorMessage(error);
    }
  }

  const document = await db.generatedDocument.create({
    data: {
      userId: input.userId,
      propertyId: localProperty?.id ?? null,
      propertyIndexId: propertyIndex?.id ?? null,
      templateId: template.id,
      title: rendered.title,
      status,
      renderedBody: rendered.body,
      fieldValuesJson: JSON.stringify(fieldValues),
      googleDocId,
      googleDocUrl,
      pdfUrl: null,
      errorMessage: generationError,
    },
    include: {
      property: true,
      propertyIndex: true,
      template: true,
    },
  });

  if (status === "error") {
    return document;
  }

  return db.generatedDocument.update({
    where: { id: document.id },
    data: {
      pdfUrl: `/api/documents/pdf/${document.id}`,
    },
    include: {
      property: true,
      propertyIndex: true,
      template: true,
    },
  });
}
