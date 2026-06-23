import { describe, expect, it } from "vitest";
import { planAlphaUserInvite } from "@/lib/alpha-invite";

describe("alpha user invite planning", () => {
  it("refuses to invite an email that is not on the Almanac allowlist", () => {
    const plan = planAlphaUserInvite({
      targetEmail: "operator@example.com",
      allowedEmails: ["alpha-tester@example.com"],
      clerkUserEmails: [],
      clerkInvitationEmails: [],
      sendRequested: true,
    });

    expect(plan.status).toBe("not-allowlisted");
    expect(plan.ok).toBe(false);
    expect(plan.shouldCreateInvitation).toBe(false);
    expect(plan.detail).toContain("ALMANAC_ALLOWED_EMAILS");
  });

  it("plans a dry run for an allowed email that is not yet in Clerk", () => {
    const plan = planAlphaUserInvite({
      targetEmail: " operator@example.com ",
      allowedEmails: ["alpha-tester@example.com", "operator@example.com"],
      clerkUserEmails: [],
      clerkInvitationEmails: [],
      sendRequested: false,
    });

    expect(plan).toEqual({
      email: "operator@example.com",
      status: "dry-run-ready",
      ok: true,
      shouldCreateInvitation: false,
      detail:
        "Dry run only. operator@example.com is allowlisted and can receive a Clerk invitation when --send is used.",
    });
  });

  it("allows sending only when the email is allowlisted and not already present", () => {
    const plan = planAlphaUserInvite({
      targetEmail: "operator@example.com",
      allowedEmails: ["operator@example.com"],
      clerkUserEmails: [],
      clerkInvitationEmails: [],
      sendRequested: true,
    });

    expect(plan.status).toBe("send-ready");
    expect(plan.ok).toBe(true);
    expect(plan.shouldCreateInvitation).toBe(true);
  });

  it("does not create a duplicate invite for an existing Clerk user", () => {
    const plan = planAlphaUserInvite({
      targetEmail: "operator@example.com",
      allowedEmails: ["operator@example.com"],
      clerkUserEmails: ["operator@example.com"],
      clerkInvitationEmails: [],
      sendRequested: true,
    });

    expect(plan.status).toBe("already-user");
    expect(plan.ok).toBe(true);
    expect(plan.shouldCreateInvitation).toBe(false);
  });

  it("does not create a duplicate invite for an existing Clerk invitation", () => {
    const plan = planAlphaUserInvite({
      targetEmail: "operator@example.com",
      allowedEmails: ["operator@example.com"],
      clerkUserEmails: [],
      clerkInvitationEmails: ["operator@example.com"],
      sendRequested: true,
    });

    expect(plan.status).toBe("already-invited");
    expect(plan.ok).toBe(true);
    expect(plan.shouldCreateInvitation).toBe(false);
  });
});
