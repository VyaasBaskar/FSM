import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static generation and caching where possible
  experimental: {
    // Enable optimized fetch caching
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  // Configure caching headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
