import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix Vercel deployment issues
  trailingSlash: true,
  images: {
    unoptimized: true
  },
};

export default nextConfig;
