import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      tailwindcss: path.resolve(process.cwd(), 'node_modules/tailwindcss'),
      'tw-animate-css': path.resolve(process.cwd(), 'node_modules/tw-animate-css'),
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.google.com' },
      { protocol: 'https', hostname: 'www.facebook.com' },
      { protocol: 'https', hostname: 'www.twitter.com' },
      { protocol: 'https', hostname: 'www.instagram.com' },
      { protocol: 'https', hostname: 'www.linkedin.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
};

export default withNextIntl(nextConfig);