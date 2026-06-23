import { getDb } from "@/lib/db";

export type PropertyVisitUpsertInput = {
  userId: string;
  propertyIndexId: string;
  openedAt: Date;
};

export function buildPropertyVisitUpsertArgs(input: PropertyVisitUpsertInput) {
  return {
    where: {
      userId_propertyIndexId: {
        userId: input.userId,
        propertyIndexId: input.propertyIndexId,
      },
    },
    create: {
      userId: input.userId,
      propertyIndexId: input.propertyIndexId,
      openedAt: input.openedAt,
    },
    update: {
      openedAt: input.openedAt,
    },
  };
}

export async function recordPropertyVisit(input: {
  userId: string;
  propertyIndexId: string;
  openedAt?: Date;
}) {
  const db = await getDb();

  return db.propertyVisit.upsert(
    buildPropertyVisitUpsertArgs({
      userId: input.userId,
      propertyIndexId: input.propertyIndexId,
      openedAt: input.openedAt ?? new Date(),
    }),
  );
}
