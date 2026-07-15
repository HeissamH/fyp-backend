import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // swagger-ui-react still uses legacy lifecycles; Strict Mode logs noisy dev-only warnings.
  reactStrictMode: false,
  // Security headers applied to all routes
  async headers() {
    return [
      {
        // Android App Links verification must be publicly cacheable JSON
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
