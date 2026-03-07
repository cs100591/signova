import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'canvas', '@google-cloud/vision'],
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
