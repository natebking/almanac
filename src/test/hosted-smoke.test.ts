import { describe, expect, it } from "vitest";
import { evaluateHostedSmoke } from "@/lib/hosted-smoke";

describe("hosted smoke check", () => {
  it("passes when the hosted app is login-gated and beta smoke guidance is reachable", () => {
    const result = evaluateHostedSmoke({
      root: {
        status: 307,
        location: "/sign-in?redirect_url=https%3A%2F%2Falmanac-alpha.example.com%2F",
      },
      setupPage: {
        status: 200,
        body:
          "Ready for the alpha tester's beta smoke test. alpha-tester@example.com. Almanac Test Portfolio Almanac Test Master Spreadsheet Alpha handoff npm run alpha:google-oauth npm run alpha:readiness npm run alpha:invite-user -- --email operator@example.com",
      },
      signInPage: {
        status: 200,
        body: "Sign in to your property hub.",
      },
    });

    expect(result.ready).toBe(true);
    expect(result.checks.map((check) => [check.id, check.status])).toEqual([
      ["root-login-gate", "pass"],
      ["setup-page-copy", "pass"],
      ["setup-handoff-commands", "pass"],
      ["sign-in-reachable", "pass"],
    ]);
  });

  it("fails when sign-in is hidden behind the setup gate", () => {
    const result = evaluateHostedSmoke({
      root: {
        status: 307,
        location: "/setup-required?reason=missing-google-oauth",
      },
      setupPage: {
        status: 200,
        body:
          "Ready for the alpha tester's beta smoke test. alpha-tester@example.com. Almanac Test Portfolio Almanac Test Master Spreadsheet Alpha handoff npm run alpha:google-oauth npm run alpha:readiness npm run alpha:invite-user -- --email operator@example.com",
      },
      signInPage: {
        status: 307,
        body: "Hosted setup is still in progress.",
      },
    });

    expect(result.ready).toBe(false);
    expect(
      result.checks.find((check) => check.id === "sign-in-reachable"),
    ).toMatchObject({
      status: "fail",
      detail: "Expected /sign-in to return 200 with the Clerk sign-in page.",
    });
  });

  it("fails when the setup page omits alpha handoff commands", () => {
    const result = evaluateHostedSmoke({
      root: {
        status: 307,
        location: "/setup-required?reason=missing-google-oauth",
      },
      setupPage: {
        status: 200,
        body:
          "Ready for the alpha tester's beta smoke test. alpha-tester@example.com.",
      },
      signInPage: {
        status: 200,
        body: "Sign in to your property hub.",
      },
    });

    expect(result.ready).toBe(false);
    expect(
      result.checks.find((check) => check.id === "setup-handoff-commands"),
    ).toMatchObject({
      status: "fail",
      detail:
        "Expected the setup page to include the alpha handoff commands.",
    });
  });
});
