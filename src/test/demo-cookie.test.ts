import { describe, expect, it } from "vitest";
import { shouldMintDemoSandbox } from "@/lib/demo-cookie";

const chrome =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const pageLoad = {
  host: "demo.almanac.homes",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  secFetchMode: "navigate",
  userAgent: chrome,
};

describe("shouldMintDemoSandbox", () => {
  it("gives a browser loading a demo page its own sandbox", () => {
    expect(shouldMintDemoSandbox(pageLoad)).toBe(true);
  });

  it("accepts older browsers that send no fetch metadata", () => {
    expect(shouldMintDemoSandbox({ ...pageLoad, secFetchMode: null })).toBe(true);
  });

  it.each([
    ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
    ["headless Chrome", chrome.replace("Chrome/", "HeadlessChrome/")],
    ["Slack link preview", "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"],
    ["curl", "curl/8.5.0"],
    ["no user agent", null],
  ])("does not mint for %s", (_label, userAgent) => {
    expect(shouldMintDemoSandbox({ ...pageLoad, userAgent })).toBe(false);
  });

  it("does not mint for non-page requests", () => {
    expect(shouldMintDemoSandbox({ ...pageLoad, accept: "*/*" })).toBe(false);
    expect(shouldMintDemoSandbox({ ...pageLoad, secFetchMode: "cors" })).toBe(false);
  });

  it("does not mint on the marketing landing page", () => {
    expect(shouldMintDemoSandbox({ ...pageLoad, host: "almanac.homes" })).toBe(false);
    expect(shouldMintDemoSandbox({ ...pageLoad, host: "www.almanac.homes" })).toBe(false);
  });
});
