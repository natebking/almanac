import { almanacTestPortfolio } from "@/lib/alpha-config";

export type HostedSmokeHttpResult = {
  status: number;
  location?: string | null;
  body?: string;
};

export type HostedSmokeInput = {
  root: HostedSmokeHttpResult;
  setupPage: HostedSmokeHttpResult;
  signInPage: HostedSmokeHttpResult;
};

export type HostedSmokeCheck = {
  id: string;
  label: string;
  status: "pass" | "fail";
  detail: string;
};

export type HostedSmokeReport = {
  ready: boolean;
  checks: HostedSmokeCheck[];
};

export function evaluateHostedSmoke(input: HostedSmokeInput): HostedSmokeReport {
  const checks: HostedSmokeCheck[] = [
    passFailCheck({
      id: "root-login-gate",
      label: "Root login gate",
      pass:
        isRedirect(input.root.status) &&
        Boolean(input.root.location?.includes("/sign-in")),
      passDetail: "The hosted root redirects to Clerk sign-in.",
      failDetail:
        "Expected / to redirect to Clerk sign-in while the app is hosted.",
    }),
    passFailCheck({
      id: "setup-page-copy",
      label: "Setup page copy",
      pass:
        input.setupPage.status === 200 &&
        includesText(input.setupPage.body, "Ready for the alpha tester") &&
        includesText(input.setupPage.body, "alpha-tester@example.com"),
      passDetail:
        "The setup page explains the beta smoke-test state and the alpha tester's test account.",
      failDetail:
        "Expected setup page to explain the beta smoke-test state for alpha-tester@example.com.",
    }),
    passFailCheck({
      id: "setup-handoff-commands",
      label: "Setup handoff commands",
      pass:
        input.setupPage.status === 200 &&
        includesText(input.setupPage.body, "Alpha handoff") &&
        includesText(input.setupPage.body, "npm run alpha:google-oauth") &&
        includesText(input.setupPage.body, "npm run alpha:readiness") &&
        includesText(input.setupPage.body, almanacTestPortfolio.driveFolderName) &&
        includesText(
          input.setupPage.body,
          almanacTestPortfolio.masterSpreadsheetName,
        ) &&
        includesText(
          input.setupPage.body,
          "npm run alpha:invite-user -- --email operator@example.com",
        ),
      passDetail:
        "The setup page includes the alpha handoff commands.",
      failDetail:
        "Expected the setup page to include the alpha handoff commands.",
    }),
    passFailCheck({
      id: "sign-in-reachable",
      label: "Sign-in reachable",
      pass:
        input.signInPage.status === 200 &&
        includesText(input.signInPage.body, "Sign in to your property hub"),
      passDetail:
        "The Clerk sign-in page is reachable for the private beta.",
      failDetail: "Expected /sign-in to return 200 with the Clerk sign-in page.",
    }),
  ];

  return {
    ready: checks.every((check) => check.status === "pass"),
    checks,
  };
}

export function formatHostedSmokeReport(report: HostedSmokeReport): string {
  const lines = [
    "Almanac hosted smoke check",
    `Ready for hosted auth smoke: ${report.ready ? "yes" : "no"}`,
    "",
    "Checks:",
    ...report.checks.map(
      (check) =>
        `- ${check.status === "pass" ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`,
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function passFailCheck({
  id,
  label,
  pass,
  passDetail,
  failDetail,
}: {
  id: string;
  label: string;
  pass: boolean;
  passDetail: string;
  failDetail: string;
}): HostedSmokeCheck {
  return {
    id,
    label,
    status: pass ? "pass" : "fail",
    detail: pass ? passDetail : failDetail,
  };
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function includesText(body: string | undefined, text: string): boolean {
  return Boolean(body?.includes(text));
}
