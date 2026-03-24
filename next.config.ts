import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year — wine product images are immutable
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [48, 80, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'stappando.it' },
      { protocol: 'https', hostname: '*.stappando.it' },
      { protocol: 'https', hostname: 'i0.wp.com' },
      { protocol: 'https', hostname: 'i1.wp.com' },
      { protocol: 'https', hostname: 'i2.wp.com' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload warnings in dev
  silent: true,
  // Upload source maps for better stack traces in production
  widenClientFileUpload: true,
  // Disable Sentry telemetry
  telemetry: false,
});
