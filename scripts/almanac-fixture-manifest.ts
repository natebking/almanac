import fs from "node:fs";
import path from "node:path";
import {
  buildManualDriveSetupPlan,
  formatManualDriveSetupPlan,
} from "../src/lib/fixtures/manual-drive-setup";

const fixtureRoot = path.join(process.cwd(), "fixtures", "almanac-test-portfolio");

const relativePaths = listFiles(fixtureRoot);
const plan = buildManualDriveSetupPlan(relativePaths);

process.stdout.write(formatManualDriveSetupPlan(plan));

function listFiles(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`Fixture folder does not exist: ${dir}`);
  }

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
