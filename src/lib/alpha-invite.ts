import { normalizeEmails } from "@/lib/clerk-access-readiness";

export type AlphaInviteStatus =
  | "invalid-email"
  | "not-allowlisted"
  | "already-user"
  | "already-invited"
  | "dry-run-ready"
  | "send-ready";

export type AlphaInvitePlan = {
  email: string;
  status: AlphaInviteStatus;
  ok: boolean;
  shouldCreateInvitation: boolean;
  detail: string;
};

export type AlphaInvitePlanInput = {
  targetEmail: string;
  allowedEmails: string[];
  clerkUserEmails: string[];
  clerkInvitationEmails: string[];
  sendRequested: boolean;
};

export function planAlphaUserInvite({
  targetEmail,
  allowedEmails,
  clerkUserEmails,
  clerkInvitationEmails,
  sendRequested,
}: AlphaInvitePlanInput): AlphaInvitePlan {
  const email = targetEmail.trim().toLowerCase();

  if (!isLikelyEmail(email)) {
    return {
      email,
      status: "invalid-email",
      ok: false,
      shouldCreateInvitation: false,
      detail: "Provide a valid email address for the alpha invite.",
    };
  }

  if (!normalizeEmails(allowedEmails).includes(email)) {
    return {
      email,
      status: "not-allowlisted",
      ok: false,
      shouldCreateInvitation: false,
      detail: `${email} is not in ALMANAC_ALLOWED_EMAILS. Add it there before sending a Clerk invitation.`,
    };
  }

  if (normalizeEmails(clerkUserEmails).includes(email)) {
    return {
      email,
      status: "already-user",
      ok: true,
      shouldCreateInvitation: false,
      detail: `${email} is already a Clerk user.`,
    };
  }

  if (normalizeEmails(clerkInvitationEmails).includes(email)) {
    return {
      email,
      status: "already-invited",
      ok: true,
      shouldCreateInvitation: false,
      detail: `${email} already has a Clerk invitation.`,
    };
  }

  if (!sendRequested) {
    return {
      email,
      status: "dry-run-ready",
      ok: true,
      shouldCreateInvitation: false,
      detail: `Dry run only. ${email} is allowlisted and can receive a Clerk invitation when --send is used.`,
    };
  }

  return {
    email,
    status: "send-ready",
    ok: true,
    shouldCreateInvitation: true,
    detail: `${email} is allowlisted and ready for a Clerk invitation.`,
  };
}

function isLikelyEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
