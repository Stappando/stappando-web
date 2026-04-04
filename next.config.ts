import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const WP_BACKEND = process.env.WP_BACKEND_URL || 'https://stappando.it';

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      // Proxy WordPress paths to SiteGround backend
      { source: '/wp-json/:path*', destination: `${WP_BACKEND}/wp-json/:path*` },
      { source: '/wp-admin/:path*', destination: `${WP_BACKEND}/wp-admin/:path*` },
      { source: '/wp-content/:path*', destination: `${WP_BACKEND}/wp-content/:path*` },
      { source: '/wp-login.php', destination: `${WP_BACKEND}/wp-login.php` },
      { source: '/wp-includes/:path*', destination: `${WP_BACKEND}/wp-includes/:path*` },
    ];
  },
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
