import {
  evaluateHostedSmoke,
  formatHostedSmokeReport,
  type HostedSmokeHttpResult,
} from "../src/lib/hosted-smoke";

const baseUrl = normalizeBaseUrl(
  process.env.ALMANAC_SMOKE_URL ||
    process.env.APP_URL ||
    "https://almanac-alpha.example.com",
);

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const root = await fetchPage("/", { redirect: "manual" });
  const setupPath =
    root.location?.startsWith("/") && root.location.includes("/setup-required")
      ? root.location
      : "/setup-required";
  const setupPage = await fetchPage(setupPath);
  const signInPage = await fetchPage("/sign-in");

  const report = evaluateHostedSmoke({ root, setupPage, signInPage });
  process.stdout.write(formatHostedSmokeReport(report));

  if (!report.ready) {
    process.exitCode = 1;
  }
}

async function fetchPage(
  path: string,
  init?: RequestInit,
): Promise<HostedSmokeHttpResult> {
  const response = await fetch(new URL(path, baseUrl), init);
  return {
    status: response.status,
    location: response.headers.get("location"),
    body: await response.text(),
  };
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
