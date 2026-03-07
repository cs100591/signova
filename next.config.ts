import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/contracts',
        permanent: true,
      },
      {
        source: '/pricing',
        destination: '/#pricing',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
