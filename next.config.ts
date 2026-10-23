import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Type checking dijalankan secara terpisah via `npm run typecheck`
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
