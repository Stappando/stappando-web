import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2, // 20% of transactions — enough for a wine ecommerce
  replaysSessionSampleRate: 0, // No session replay by default
  replaysOnErrorSampleRate: 0.5, // 50% of error sessions get replay
});
