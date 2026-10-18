import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Self-hosted fonts: no Google Fonts CDN calls at runtime.
  // Fonts bundled via @fontsource, served from local server.
};

export default nextConfig;
