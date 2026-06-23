import fs from "node:fs";
import path from "node:path";
import {
  buildManualDriveSetupPlan,
  formatManualDriveSetupPlan,
} from "../src/lib/fixtures/manual-drive-setup";

const fixtureRoot = path.join(process.cwd(), "fixtures", "almanac-test-portfolio");
const outputRoot = path.join(process.cwd(), "build", "almanac-test-portfolio-upload");

if (!fs.existsSync(fixtureRoot)) {
  throw new Error(`Fixture folder does not exist: ${fixtureRoot}`);
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
copyDirectory(fixtureRoot, outputRoot);

const plan = buildManualDriveSetupPlan(listFiles(outputRoot));
fs.writeFileSync(
  path.join(outputRoot, "UPLOAD-INSTRUCTIONS.md"),
  formatManualDriveSetupPlan(plan),
);
fs.writeFileSync(
  path.join(outputRoot, "almanac-upload-manifest.json"),
  `${JSON.stringify(plan, null, 2)}\n`,
);

process.stdout.write(`Created ${path.relative(process.cwd(), outputRoot)}\n`);
process.stdout.write(formatManualDriveSetupPlan(plan));

function copyDirectory(source: string, target: string) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function listFiles(dir: string, base = dir): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolutePath, base);
      }
      if (!entry.isFile() || entry.name.startsWith(".")) {
        return [];
      }
      return path.relative(base, absolutePath).split(path.sep).join("/");
    })
    .sort((a, b) => a.localeCompare(b));
}
