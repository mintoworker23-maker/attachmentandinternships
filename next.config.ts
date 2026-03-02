import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // allow logos that come from CampusBiz via the i0.wp.com proxy
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i0.wp.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "i0.wp.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/sitemap.xml",
          destination: "/api/sitemap",
        },
      ],
    };
  },
};

export default nextConfig;
