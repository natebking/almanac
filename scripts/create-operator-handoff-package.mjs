import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z");
const outputRoot = path.join(repoRoot, "build", "almanac-self-host-handoff");
const packageRootName = "Almanac";
const packageRoot = path.join(outputRoot, packageRootName);
const tarballPath = path.join(outputRoot, `almanac-self-host-handoff-${stamp}.tar.gz`);
const zipPath = path.join(outputRoot, `almanac-self-host-handoff-${stamp}.zip`);

const rootFiles = [
  "AGENTS.md",
  "BOT_HANDOFF.md",
  "CLAUDE.md",
  "OPERATOR_START_HERE.md",
  "README.md",
  ".env.example",
  ".gitignore",
  "eslint.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "prisma.config.ts",
  "tsconfig.json",
  "vitest.config.ts",
];

const rootDirs = ["docs", "fixtures", "prisma", "public", "scripts", "src"];

const skipNames = new Set([
  ".DS_Store",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".next",
  ".vercel",
  "build",
  "coverage",
  "dev.db",
  "node_modules",
  "out",
]);

const skipPathParts = [
  `${path.sep}src${path.sep}generated`,
  `${path.sep}prisma${path.sep}dev.db`,
];

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(packageRoot, { recursive: true });

for (const file of rootFiles) {
  copyEntry(path.join(repoRoot, file), path.join(packageRoot, file));
}

for (const dir of rootDirs) {
  copyEntry(path.join(repoRoot, dir), path.join(packageRoot, dir));
}

writeManifest();
assertNoForbiddenFiles(packageRoot);
createTarball();
createZipIfAvailable();

console.log("Almanac operator handoff package created.");
console.log(`Folder: ${packageRoot}`);
console.log(`Tarball: ${tarballPath}`);
if (fs.existsSync(zipPath)) {
  console.log(`Zip: ${zipPath}`);
}

function copyEntry(source, target) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required package entry: ${path.relative(repoRoot, source)}`);
  }

  const stat = fs.statSync(source);
  if (shouldSkip(source)) {
    return;
  }

  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const child of fs.readdirSync(source)) {
      copyEntry(path.join(source, child), path.join(target, child));
    }
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function shouldSkip(source) {
  const baseName = path.basename(source);
  if (skipNames.has(baseName)) {
    return true;
  }

  if (baseName.endsWith(".db") || baseName.endsWith(".sqlite")) {
    return true;
  }

  const normalized = source.split(path.sep).join(path.sep);
  return skipPathParts.some((part) => normalized.includes(part));
}

function writeManifest() {
  const lines = [
    "# Almanac Handoff Package Contents",
    "",
    `Created: ${new Date().toISOString()}`,
    "",
    "Start here:",
    "- OPERATOR_START_HERE.md",
    "- BOT_HANDOFF.md",
    "- README.md",
    "- docs/operator-env-reference.md",
    "",
    "This package intentionally excludes:",
    "- .env and .env.local",
    "- node_modules",
    "- .next",
    "- build output",
    "- local SQLite database files",
    "- Vercel project cache",
    "- generated Prisma client output",
    "",
  ];

  fs.writeFileSync(path.join(packageRoot, "HANDOFF_CONTENTS.md"), lines.join("\n"));
}

function assertNoForbiddenFiles(root) {
  const forbidden = [];
  walk(root, (entry) => {
    const relative = path.relative(root, entry);
    const baseName = path.basename(entry);
    if (
      baseName === ".env" ||
      baseName === ".env.local" ||
      relative.startsWith(`node_modules${path.sep}`) ||
      relative.startsWith(`.next${path.sep}`) ||
      relative.startsWith(`.vercel${path.sep}`) ||
      relative.startsWith(`build${path.sep}`) ||
      relative.startsWith(`src${path.sep}generated${path.sep}`) ||
      relative === `src${path.sep}generated` ||
      relative.endsWith(".db") ||
      relative.endsWith(".sqlite")
    ) {
      forbidden.push(relative);
    }
  });

  if (forbidden.length > 0) {
    throw new Error(`Package contains forbidden local files:\n${forbidden.join("\n")}`);
  }
}

function walk(root, visit) {
  for (const entryName of fs.readdirSync(root)) {
    const entry = path.join(root, entryName);
    visit(entry);
    if (fs.statSync(entry).isDirectory()) {
      walk(entry, visit);
    }
  }
}

function createTarball() {
  const result = spawnSync("tar", ["-czf", tarballPath, "-C", outputRoot, packageRootName], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "Could not create tarball.");
  }
}

function createZipIfAvailable() {
  const zipExists = spawnSync("zip", ["-v"], { encoding: "utf8" });
  if (zipExists.status !== 0) {
    return;
  }

  const result = spawnSync("zip", ["-qry", zipPath, packageRootName], {
    cwd: outputRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "Could not create zip package.");
  }
}
