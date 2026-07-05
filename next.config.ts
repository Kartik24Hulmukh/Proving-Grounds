import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typedRoutes disabled — causes issues with dynamic admin routes
  // Ensure server-only packages are not bundled into client
  serverExternalPackages: ["@neondatabase/serverless", "postgres", "better-auth"],
};

export default nextConfig;
