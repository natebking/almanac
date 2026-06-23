import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recordPropertyVisit } from "@/lib/property-visits";
import { getAlphaUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getAlphaUser();
  const payload = await request.json().catch(() => null);
  const propertyIndexId =
    typeof payload?.propertyIndexId === "string"
      ? payload.propertyIndexId.trim()
      : "";

  if (!propertyIndexId) {
    return NextResponse.json(
      { error: "propertyIndexId is required" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const property = await db.propertyIndex.findFirst({
    where: { id: propertyIndexId, userId: user.id },
    select: { id: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const visit = await recordPropertyVisit({
    userId: user.id,
    propertyIndexId,
  });

  return NextResponse.json({ id: visit.id, ok: true });
}
