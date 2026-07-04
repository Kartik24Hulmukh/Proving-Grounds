import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // Ensure server-only packages are not bundled into client
  serverExternalPackages: ["@neondatabase/serverless", "postgres", "better-auth"],
};

export default nextConfig;
