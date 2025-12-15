import type { NextConfig } from "next";

const nextConfig: any = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ytrxhrltkqztkcnqlcrz.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ytrxhrltkqztkcnqlcrz.storage.supabase.co",
      },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "tse2.mm.bing.net" },
      { protocol: "https", hostname: "tse1.mm.bing.net" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "ccfqsrvqfbigkhcbtoac.supabase.co" },
      {
        protocol: "https",
        hostname: "ytrxhrltkqztkcnqlcrz.storage.supabase.co",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:5500"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;