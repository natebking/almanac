import type { MetadataRoute } from "next";

// API routes answer with redirects or JSON, never pages, so keep crawlers off
// them; Search Console otherwise reports them as "Page with redirect".
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: "https://almanac.homes/sitemap.xml",
  };
}
