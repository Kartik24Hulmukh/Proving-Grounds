import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typedRoutes disabled — causes issues with dynamic admin routes
  // Ensure server-only packages are not bundled into client
  serverExternalPackages: ["@neondatabase/serverless", "postgres", "better-auth"],
  // Disable static optimization for error pages — they need React context
  // which is unavailable during prerender without a full client bundle
  experimental: {
    staticGenerationRetryCount: 0,
  },
};

export default nextConfig;
