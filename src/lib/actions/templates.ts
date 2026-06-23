"use server";

import { revalidatePath } from "next/cache";
import { extractPlaceholders } from "@/lib/placeholders";
import { getDb } from "@/lib/db";
import { extractGoogleDocId } from "@/lib/google/ids";
import { getAlphaUser } from "@/lib/session";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createTemplate(formData: FormData) {
  const db = await getDb();
  const user = await getAlphaUser();
  const localBody = text(formData, "localBody");
  const googleDocUrl = text(formData, "googleDocUrl");
  const googleDocId = text(formData, "googleDocId") || extractGoogleDocId(googleDocUrl);

  await db.documentTemplate.create({
    data: {
      userId: user.id,
      name: text(formData, "name"),
      description: text(formData, "description"),
      googleDocId: googleDocId || null,
      googleDocUrl: googleDocUrl || null,
      localBody,
      placeholders: JSON.stringify(extractPlaceholders(localBody)),
    },
  });

  revalidatePath("/documents");
}

export async function deleteTemplate(formData: FormData) {
  const db = await getDb();
  const user = await getAlphaUser();
  const id = text(formData, "id");

  await db.documentTemplate.delete({
    where: { id, userId: user.id },
  });

  revalidatePath("/");
  revalidatePath("/documents");
}
