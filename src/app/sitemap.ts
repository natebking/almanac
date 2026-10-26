import type { MetadataRoute } from "next";

// Only the public landing is meant to be indexed. It is served at the
// almanac.homes root (rewritten from /open-source in next.config.ts), so list
// that final URL and nothing that redirects.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://almanac.homes/" }];
}
