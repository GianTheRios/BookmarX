import type { NextConfig } from "next";
import path from "path";

// Security headers for production
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

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

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
