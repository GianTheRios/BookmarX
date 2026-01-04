import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Transpile the shared package
  transpilePackages: ["@bookmarx/shared"],

  // Allow external images from Twitter
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "abs.twimg.com",
      },
    ],
  },

  // Turbopack config (Next.js 16 default)
  turbopack: {
    resolveAlias: {
      "@bookmarx/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },

  // Webpack config for production builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@bookmarx/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    };
    return config;
  },
};

export default nextConfig;
