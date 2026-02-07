import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.google.com' },
      { protocol: 'https', hostname: 'www.facebook.com' },
      { protocol: 'https', hostname: 'www.twitter.com' },
      { protocol: 'https', hostname: 'www.instagram.com' },
      { protocol: 'https', hostname: 'www.linkedin.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
