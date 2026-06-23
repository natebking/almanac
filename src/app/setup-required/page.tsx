import { setupGuidanceForReason } from "@/lib/setup-guidance";
import { hasAllowedUserEmails } from "@/lib/hosted-setup";
import { almanacTestPortfolio } from "@/lib/alpha-config";

export const dynamic = "force-dynamic";

const setupChecks = [
  {
    label: "Clerk publishable key",
    configured: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  },
  {
    label: "Clerk secret key",
    configured: Boolean(process.env.CLERK_SECRET_KEY),
  },
  {
    label: "Postgres database URL",
    configured: Boolean(process.env.DATABASE_URL),
  },
  {
    label: "Google OAuth client",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  {
    label: "Allowed user emails",
    configured: hasAllowedUserEmails(process.env.ALMANAC_ALLOWED_EMAILS),
  },
];

const alphaHandoffCommands = [
  {
    label: "Google OAuth checklist",
    command: "npm run alpha:google-oauth",
  },
  {
    label: "Readiness check",
    command: "npm run alpha:readiness",
  },
  {
    label: "Hosted login smoke",
    command: "npm run alpha:hosted-smoke",
  },
  {
    label: "operator invite dry run",
    command: "npm run alpha:invite-user -- --email operator@example.com",
  },
];

const alphaTestPortfolioLinks = [
  {
    label: "Drive folder",
    name: almanacTestPortfolio.driveFolderName,
    href: almanacTestPortfolio.driveFolderUrl,
  },
  {
    label: "Master Sheet",
    name: `${almanacTestPortfolio.masterSpreadsheetName} (${almanacTestPortfolio.sheetTabName})`,
    href: almanacTestPortfolio.masterSpreadsheetUrl,
  },
];

type SetupRequiredSearchParams = Promise<{
  reason?: string | string[];
}>;

export default async function SetupRequiredPage({
  searchParams,
}: {
  searchParams: SetupRequiredSearchParams;
}) {
  const guidance = setupGuidanceForReason((await searchParams).reason);

  return (
    <section className="auth-panel">
      <div className="auth-copy">
        <span className="brand-mark auth-brand-mark">A</span>
        <p className="muted-label">Almanac</p>
        <h1>Almanac beta setup</h1>
        <p>
          The hosted app is deployed for the alpha tester&apos;s test account. Use this checklist
          to confirm the Google Drive workflow before operator is invited.
        </p>
      </div>
      <div className="auth-mode-card">
        <p className="muted-label">Setup status</p>
        <h2>{guidance.heading}</h2>
        <p>{guidance.summary}</p>
        <div className="setup-action-list">
          {guidance.actions.map((action, index) => (
            <div className="setup-action-row" key={action}>
              <span>{index + 1}</span>
              <p>{action}</p>
            </div>
          ))}
        </div>
        <div className="setup-check-list">
          {setupChecks.map((check) => (
            <div className="setup-check-row" key={check.label}>
              <span>{check.label}</span>
              <strong>{check.configured ? "Configured" : "Missing"}</strong>
            </div>
          ))}
        </div>
        <div className="setup-command-panel">
          <p className="muted-label">Alpha handoff</p>
          <div className="setup-command-list">
            {alphaHandoffCommands.map((item) => (
              <div className="setup-command-row" key={item.command}>
                <span>{item.label}</span>
                <code>{item.command}</code>
              </div>
            ))}
          </div>
        </div>
        <div className="setup-command-panel">
          <p className="muted-label">Test portfolio</p>
          <div className="setup-command-list">
            {alphaTestPortfolioLinks.map((item) => (
              <a className="setup-command-row" href={item.href} key={item.href}>
                <span>{item.label}</span>
                <code>{item.name}</code>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
