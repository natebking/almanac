import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import {
  assessAlphaReadiness,
  expectedAlmanacFixtureInventory,
  type AlphaReadinessEnv,
  type FixtureInventory,
  type ReadinessCheck,
} from "../src/lib/alpha-readiness";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({
  path: ".env.local",
  override: !process.env.VERCEL_ENV,
  quiet: true,
});

const fixtureRoot = path.join(process.cwd(), "fixtures", "almanac-test-portfolio");
const report = assessAlphaReadiness({
  env: process.env as AlphaReadinessEnv,
  fixtures: readFixtureInventory(fixtureRoot),
});

console.log("Almanac alpha readiness");
console.log(`Ready for alpha tester hosted test: ${report.readyForHostedAlphaTest ? "yes" : "no"}`);
printSection("Next actions", report.nextActions);
printSection("Blockers", report.blockers);
printSection("Warnings", report.warnings);
printSection("Manual checks", report.manualChecks);

if (report.blockers.length > 0) {
  process.exitCode = 1;
}

function readFixtureInventory(root: string): FixtureInventory {
  const templateDir = path.join(root, "Templates");
  const propertyFolders = directoryNames(root).filter((name) => name !== "Templates");
  const sourceFilesByProperty = Object.fromEntries(
    expectedAlmanacFixtureInventory.expectedProperties.map((property) => [
      property,
      supportedSourceFiles(path.join(root, property)),
    ]),
  );

  return {
    masterSpreadsheetExists: fs.existsSync(path.join(root, "master-spreadsheet.csv")),
    propertyFolders,
    templateFiles: supportedSourceFiles(templateDir),
    sourceFilesByProperty,
  };
}

function directoryNames(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function supportedSourceFiles(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return supportedSourceFiles(absolutePath, base);
      }
      if (!entry.isFile() || !isSupportedTextFile(entry.name)) {
        return [];
      }
      return path.relative(base, absolutePath).split(path.sep).join("/");
    })
    .sort((a, b) => a.localeCompare(b));
}

function isSupportedTextFile(fileName: string): boolean {
  return [".md", ".txt"].includes(path.extname(fileName).toLowerCase());
}

function printSection(title: string, checks: ReadinessCheck[]) {
  console.log("");
  console.log(`${title}:`);
  if (checks.length === 0) {
    console.log("- None");
    return;
  }

  for (const check of checks) {
    console.log(`- ${check.label}: ${check.detail}`);
  }
}
