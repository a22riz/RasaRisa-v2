import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Self-hosted fonts: no Google Fonts CDN calls at runtime.
  // Fonts bundled via @fontsource, served from local server.
  // Receipt uploads via Server Action: max 5MB per AGENTS.md.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
