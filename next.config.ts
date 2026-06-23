import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Keep the Prisma adapters out of the serverless bundle. The demo-reset route
  // imports the seed (which can load the native SQLite adapter); leaving these
  // external avoids bundling a native module into the function.
  serverExternalPackages: [
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "@prisma/adapter-pg",
    "@prisma/client",
  ],
  images: {
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
        protocol: "https",
      },
    ],
  },
  // On the public marketing domain only, serve the landing page at the root URL.
  // A rewrite (not a redirect) keeps the URL clean — almanac.homes shows the
  // landing with no "/open-source" in the address bar. `beforeFiles` makes it
  // win over the app's own "/" page. Scoped by host so localhost and
  // self-hosted deployments are unaffected and still serve the dashboard at "/".
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "almanac.homes" }],
          destination: "/open-source",
        },
        {
          source: "/",
          has: [{ type: "host", value: "www.almanac.homes" }],
          destination: "/open-source",
        },
      ],
    };
  },
};

export default nextConfig;
