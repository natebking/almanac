import dotenv from "dotenv";
import { createClerkClient } from "@clerk/backend";
import { planAlphaUserInvite } from "../src/lib/alpha-invite";
import { normalizeEmails } from "../src/lib/clerk-access-readiness";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({
  path: ".env.local",
  override: !process.env.VERCEL_ENV,
  quiet: true,
});

const args = process.argv.slice(2);
const targetEmail = argValue("--email");
const sendRequested = args.includes("--send");
const redirectUrl = argValue("--redirect-url") || defaultRedirectUrl();
const secretKey = process.env.CLERK_SECRET_KEY;
const allowedEmails = normalizeEmails([
  process.env.ALMANAC_ALLOWED_EMAILS || "",
]);

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  if (!targetEmail) {
    console.error(
      "Usage: npm run alpha:invite-user -- --email person@example.com [--send] [--redirect-url https://almanac-alpha.example.com/sign-up]",
    );
    process.exit(1);
  }

  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is missing.");
    process.exit(1);
  }

  const email = targetEmail.trim().toLowerCase();
  const clerk = createClerkClient({ secretKey });
  const [users, invitations] = await Promise.all([
    clerk.users.getUserList({ emailAddress: [email], limit: 10 }),
    clerk.invitations.getInvitationList({ query: email, limit: 10 }),
  ]);

  const plan = planAlphaUserInvite({
    targetEmail: email,
    allowedEmails,
    clerkUserEmails: users.data.flatMap((user) =>
      user.emailAddresses.map((emailAddress) => emailAddress.emailAddress),
    ),
    clerkInvitationEmails: invitations.data.map(
      (invitation) => invitation.emailAddress,
    ),
    sendRequested,
  });

  console.log("Almanac alpha invite");
  console.log(`Target: ${plan.email || email}`);
  console.log(`Mode: ${sendRequested ? "send" : "dry-run"}`);
  console.log(`Status: ${plan.status}`);
  console.log(`Detail: ${plan.detail}`);

  if (!plan.ok) {
    process.exit(1);
  }

  if (!plan.shouldCreateInvitation) {
    return;
  }

  await clerk.invitations.createInvitation({
    emailAddress: plan.email,
    notify: true,
    redirectUrl,
    publicMetadata: {
      app: "Almanac",
      alpha: true,
    },
  });

  console.log(`Invitation sent to ${plan.email}.`);
}

function argValue(name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function defaultRedirectUrl(): string | undefined {
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) {
    return undefined;
  }
  return `${appUrl.replace(/\/+$/, "")}/sign-up`;
}
