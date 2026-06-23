"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateDocumentForUser } from "@/lib/documents/generate";
import {
  generatedDocumentRedirectHref,
  type GeneratedDocumentRedirectMode,
} from "@/lib/documents/generated-redirect";
import { getAlphaUser } from "@/lib/session";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function fieldValuesFromForm(formData: FormData) {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("field:")) {
      values[key.slice("field:".length)] = String(value).trim();
    }
  }

  return values;
}

function redirectModeFromForm(formData: FormData): GeneratedDocumentRedirectMode {
  return text(formData, "redirectMode") === "print" ? "print" : "review";
}

export async function createGeneratedDocument(formData: FormData) {
  const user = await getAlphaUser();
  const redirectMode = redirectModeFromForm(formData);
  const document = await generateDocumentForUser({
    userId: user.id,
    templateId: text(formData, "templateId"),
    propertyId: text(formData, "propertyId") || undefined,
    propertyIndexId: text(formData, "propertyIndexId") || undefined,
    values: fieldValuesFromForm(formData),
  });

  revalidatePath("/");
  revalidatePath("/documents");
  redirect(generatedDocumentRedirectHref({ ...document, mode: redirectMode }));
}
