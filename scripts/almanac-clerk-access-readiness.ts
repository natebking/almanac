import dotenv from "dotenv";
import { createClerkClient } from "@clerk/backend";
import {
  assessClerkAccessReadiness,
  normalizeEmails,
} from "../src/lib/clerk-access-readiness";
import type { ReadinessCheck } from "../src/lib/alpha-readiness";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({
  path: ".env.local",
  override: !process.env.VERCEL_ENV,
  quiet: true,
});

const secretKey = process.env.CLERK_SECRET_KEY;
const allowedEmails = normalizeEmails([
  process.env.ALMANAC_ALLOWED_EMAILS || "",
]);

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is missing.");
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  const [users, invitations] = await Promise.all([
    clerk.users.getUserList({ limit: 100 }),
    clerk.invitations.getInvitationList({ limit: 100 }),
  ]);

  const report = assessClerkAccessReadiness({
    allowedEmails,
    userEmails: users.data.flatMap((user) =>
      user.emailAddresses.map((emailAddress) => emailAddress.emailAddress),
    ),
    invitationEmails: invitations.data.map(
      (invitation) => invitation.emailAddress,
    ),
    restrictedToAllowlist: null,
  });

  console.log("Almanac Clerk access readiness");
  console.log(
    `Ready for private alpha: ${report.readyForPrivateAlpha ? "yes" : "no"}`,
  );
  printSection("Next actions", report.nextActions);
  printSection("Blockers", report.blockers);
  printSection("Warnings", report.warnings);
  printSection("Manual checks", report.manualChecks);

  if (report.blockers.length > 0) {
    process.exitCode = 1;
  }
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
