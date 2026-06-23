"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getAlphaUser } from "@/lib/session";
import {
  propertyIndexIdsFromFormData,
  vendorPropertyLinkCreateData,
} from "@/lib/vendors/property-links";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createVendor(formData: FormData) {
  const db = await getDb();
  const user = await getAlphaUser();
  const propertyIndexIds = propertyIndexIdsFromFormData(formData);

  await db.vendor.create({
    data: {
      userId: user.id,
      name: text(formData, "name"),
      trade: text(formData, "trade"),
      phone: text(formData, "phone"),
      email: text(formData, "email"),
      notes: text(formData, "notes"),
      licenseStatus: text(formData, "licenseStatus"),
      insuranceStatus: text(formData, "insuranceStatus"),
      propertyLinks: {
        create: vendorPropertyLinkCreateData(propertyIndexIds),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/vendors");
}

export async function updateVendor(formData: FormData) {
  const db = await getDb();
  const user = await getAlphaUser();
  const id = text(formData, "id");
  const propertyIndexIds = propertyIndexIdsFromFormData(formData);

  await db.$transaction(async (tx) => {
    await tx.vendor.update({
      where: { id, userId: user.id },
      data: {
        name: text(formData, "name"),
        trade: text(formData, "trade"),
        phone: text(formData, "phone"),
        email: text(formData, "email"),
        notes: text(formData, "notes"),
        licenseStatus: text(formData, "licenseStatus"),
        insuranceStatus: text(formData, "insuranceStatus"),
      },
    });
    await tx.vendorPropertyLink.deleteMany({
      where: { vendorId: id },
    });
    if (propertyIndexIds.length > 0) {
      await tx.vendorPropertyLink.createMany({
        data: propertyIndexIds.map((propertyIndexId) => ({
          vendorId: id,
          propertyIndexId,
        })),
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/vendors");
}

export async function deleteVendor(formData: FormData) {
  const db = await getDb();
  const user = await getAlphaUser();
  const id = text(formData, "id");

  await db.vendor.delete({
    where: { id, userId: user.id },
  });

  revalidatePath("/");
  revalidatePath("/vendors");
}
