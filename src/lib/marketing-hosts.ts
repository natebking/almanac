// Hosts that serve the public marketing landing instead of the product. Kept in
// sync with the apex rewrite in next.config.ts. On these hosts the app chrome
// (sidebar nav) is not rendered -- visitors see the landing page only, while the
// product demo lives on its own subdomain.
export const MARKETING_HOSTS = ["almanac.homes", "www.almanac.homes"];

export function isMarketingHost(host: string | null | undefined): boolean {
  if (!host) {
    return false;
  }
  const hostname = host.toLowerCase().split(":")[0];
  return MARKETING_HOSTS.includes(hostname);
}
