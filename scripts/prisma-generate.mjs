import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL ?? "";
const configuredProvider = process.env.DATABASE_PROVIDER;
const inferredProvider =
  databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")
    ? "postgres"
    : "sqlite";
const provider = configuredProvider || inferredProvider;

const schema =
  provider === "postgres"
    ? "prisma/schema.postgres.prisma"
    : "prisma/schema.prisma";

const result = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
