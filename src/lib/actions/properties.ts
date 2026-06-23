"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { extractDriveFolderId } from "@/lib/google/ids";
import { getAlphaUser } from "@/lib/session";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createProperty(formData: FormData) {
  const db = await getDb();
  const user = await getAlphaUser();
  const driveFolderUrl = text(formData, "driveFolderUrl");

  await db.property.create({
    data: {
      userId: user.id,
      address: text(formData, "address"),
      ownerName: text(formData, "ownerName"),
      tenantName: text(formData, "tenantName"),
      notes: text(formData, "notes"),
      utilityNotes: text(formData, "utilityNotes"),
      accessCodes: text(formData, "accessCodes"),
      applianceNotes: text(formData, "applianceNotes"),
      filterSize: text(formData, "filterSize"),
      warrantyNotes: text(formData, "warrantyNotes"),
      hoaNotes: text(formData, "hoaNotes"),
      driveFolderId: extractDriveFolderId(driveFolderUrl) || null,
      driveFolderUrl: driveFolderUrl || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/properties");
}

export async function updateProperty(formData: FormData) {
  const db = await getDb();
  const user = await getAlphaUser();
  const id = text(formData, "id");
  const driveFolderUrl = text(formData, "driveFolderUrl");

  await db.property.update({
    where: { id, userId: user.id },
    data: {
      address: text(formData, "address"),
      ownerName: text(formData, "ownerName"),
      tenantName: text(formData, "tenantName"),
      notes: text(formData, "notes"),
      utilityNotes: text(formData, "utilityNotes"),
      accessCodes: text(formData, "accessCodes"),
      applianceNotes: text(formData, "applianceNotes"),
      filterSize: text(formData, "filterSize"),
      warrantyNotes: text(formData, "warrantyNotes"),
      hoaNotes: text(formData, "hoaNotes"),
      driveFolderId: extractDriveFolderId(driveFolderUrl) || null,
      driveFolderUrl: driveFolderUrl || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/properties");
}

export async function deleteProperty(formData: FormData) {
  const db = await getDb();
  const user = await getAlphaUser();
  const id = text(formData, "id");

  await db.property.delete({
    where: { id, userId: user.id },
  });

  revalidatePath("/");
  revalidatePath("/properties");
}
