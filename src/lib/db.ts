import type { PrismaClient as PrismaClientType } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

// Cache the client on globalThis so Next.js dev hot-reloads (which re-evaluate
// modules) reuse a single PrismaClient instead of leaking instances and
// exhausting database connections on the Postgres path.
const globalForPrisma = globalThis as typeof globalThis & {
  __almanacPrisma?: PrismaClientType;
};

let prisma: PrismaClientType | null = globalForPrisma.__almanacPrisma ?? null;

export async function getDb(): Promise<PrismaClientType> {
  if (!prisma) {
    const { PrismaClient } = await import("@/generated/prisma/client");
    const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
    const adapter =
      getDatabaseProvider(databaseUrl) === "postgres"
        ? new PrismaPg(databaseUrl)
        : new PrismaBetterSqlite3({ url: databaseUrl });

    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.__almanacPrisma = prisma;
    }
  }

  return prisma;
}

function getDatabaseProvider(databaseUrl: string) {
  if (process.env.DATABASE_PROVIDER === "postgres") {
    return "postgres";
  }

  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    return "postgres";
  }

  return "sqlite";
}
