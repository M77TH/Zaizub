import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/edit",
        destination: "/editor",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;