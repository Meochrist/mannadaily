import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclure better-sqlite3 du bundle (module Node.js natif)
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    resolveAlias: {
      dns: {},
      fs: {},
      net: {},
      tls: {},
      "util/types": {},
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
