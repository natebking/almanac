import { isMarketingHost } from "@/lib/marketing-hosts";

// Per-browser demo identity cookie. Each visitor to the public demo gets their
// own private sandbox keyed by this value (minted in src/proxy.ts, resolved in
// src/lib/session.ts). It lives in its own module so the edge proxy can import
// the name without pulling in the Node-only session/database code.
export const DEMO_USER_COOKIE = "almanac_demo_uid";

// Automated clients that announce themselves. Anything that slips past this
// still only costs one sandbox, which the nightly cleanup recycles.
const AUTOMATED_USER_AGENT =
  /bot|crawl|spider|slurp|archiver|preview|monitor|scan|lighthouse|headless|curl|wget|python|httpx|axios|node-fetch|undici|go-http|java\/|okhttp|facebookexternalhit|whatsapp|telegram|discord|slack|embedly|vercel/i;

// Only a browser loading a page gets its own sandbox: it sends an HTML Accept
// header, a navigation fetch mode when it sends one at all (older Safari does
// not), and a user agent that is not an announced bot. The marketing landing
// page never touches the database, so it never needs one.
export function shouldMintDemoSandbox(request: {
  host: string | null;
  accept: string | null;
  secFetchMode: string | null;
  userAgent: string | null;
}): boolean {
  if (isMarketingHost(request.host)) {
    return false;
  }

  if (!request.accept?.includes("text/html")) {
    return false;
  }

  if (request.secFetchMode && request.secFetchMode !== "navigate") {
    return false;
  }

  const userAgent = request.userAgent ?? "";
  return userAgent.startsWith("Mozilla/") && !AUTOMATED_USER_AGENT.test(userAgent);
}
