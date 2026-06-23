import { alphaTesterEmail } from "@/lib/alpha-config";
import type { ReadinessCheck, ReadinessStatus } from "@/lib/alpha-readiness";

export type ClerkAccessReadinessInput = {
  allowedEmails: string[];
  userEmails: string[];
  invitationEmails: string[];
  restrictedToAllowlist: boolean | null | undefined;
};

export type ClerkAccessReadinessReport = {
  readyForPrivateAlpha: boolean;
  blockers: ReadinessCheck[];
  warnings: ReadinessCheck[];
  manualChecks: ReadinessCheck[];
  nextActions: ReadinessCheck[];
  checks: ReadinessCheck[];
};

export function assessClerkAccessReadiness({
  allowedEmails,
  userEmails,
  invitationEmails,
  restrictedToAllowlist,
}: ClerkAccessReadinessInput): ClerkAccessReadinessReport {
  const normalizedAllowedEmails = normalizeEmails(allowedEmails);
  const normalizedUserEmails = normalizeEmails(userEmails);
  const normalizedInvitationEmails = normalizeEmails(invitationEmails);
  const alphaTesterHasAlmanacAccess = normalizedAllowedEmails.includes(
    alphaTesterEmail,
  );
  const alphaTesterHasClerkAccess =
    normalizedUserEmails.includes(alphaTesterEmail) ||
    normalizedInvitationEmails.includes(alphaTesterEmail);
  const extraUserEmails = normalizedUserEmails.filter(
    (email) => !normalizedAllowedEmails.includes(email),
  );

  const checks: ReadinessCheck[] = [
    check({
      id: "almanac-allowed-emails",
      label: "Almanac email allowlist",
      status: alphaTesterHasAlmanacAccess ? "pass" : "missing",
      detail: alphaTesterHasAlmanacAccess
        ? `ALMANAC_ALLOWED_EMAILS includes ${alphaTesterEmail}.`
        : `Add ${alphaTesterEmail} to ALMANAC_ALLOWED_EMAILS before the alpha tester tests the hosted alpha.`,
    }),
    check({
      id: "clerk-alpha-tester-access",
      label: "Alpha tester Clerk access",
      status: alphaTesterHasClerkAccess ? "pass" : "missing",
      detail: alphaTesterHasClerkAccess
        ? `${alphaTesterEmail} exists as a Clerk user or invitation.`
        : `Invite ${alphaTesterEmail} through Clerk or sign in once with that account.`,
    }),
    check({
      id: "clerk-extra-users",
      label: "Unexpected Clerk users",
      status: extraUserEmails.length === 0 ? "pass" : "warning",
      detail:
        extraUserEmails.length === 0
          ? "Every Clerk user in this instance is on the Almanac alpha allowlist."
          : `Clerk has users outside ALMANAC_ALLOWED_EMAILS: ${extraUserEmails.join(
              ", ",
            )}. Almanac still rejects them at the app layer.`,
    }),
    restrictedModeCheck(restrictedToAllowlist),
  ];

  const blockers = checks.filter((checkItem) => checkItem.status === "missing");
  const warnings = checks.filter((checkItem) => checkItem.status === "warning");
  const manualChecks = checks.filter((checkItem) => checkItem.status === "manual");

  return {
    readyForPrivateAlpha: blockers.length === 0 && manualChecks.length === 0,
    blockers,
    warnings,
    manualChecks,
    nextActions: blockers.length > 0 ? blockers : manualChecks,
    checks,
  };
}

export function normalizeEmails(emails: string[]): string[] {
  return Array.from(
    new Set(
      emails
        .flatMap((email) => email.split(/[,\s]+/))
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function restrictedModeCheck(
  restrictedToAllowlist: boolean | null | undefined,
): ReadinessCheck {
  if (restrictedToAllowlist === true) {
    return check({
      id: "clerk-restricted-mode",
      label: "Clerk restricted mode",
      status: "pass",
      detail: "Clerk restricted mode is confirmed.",
    });
  }

  if (restrictedToAllowlist === false) {
    return check({
      id: "clerk-restricted-mode",
      label: "Clerk restricted mode",
      status: "missing",
      detail:
        "Enable Clerk restricted mode before sending the hosted URL outside the alpha tester's test account.",
    });
  }

  return check({
    id: "clerk-restricted-mode",
    label: "Clerk restricted mode",
    status: "manual",
    detail:
      "Confirm Clerk restricted mode in the Clerk dashboard before sharing the hosted URL. Almanac still rejects unallowlisted users at the app layer, but restricted mode prevents unwanted Clerk signups. The Clerk Backend API used here does not expose a read-only check for this setting.",
  });
}

function check({
  id,
  label,
  status,
  detail,
}: {
  id: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
}): ReadinessCheck {
  return {
    id,
    label,
    status,
    detail,
  };
}
