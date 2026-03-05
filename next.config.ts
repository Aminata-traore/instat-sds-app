import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    domains: [],
  },

  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
