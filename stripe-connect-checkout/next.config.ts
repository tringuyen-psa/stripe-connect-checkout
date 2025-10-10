import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix Vercel deployment issues
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Set proper root for Vercel deployment
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
