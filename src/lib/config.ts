/* ── Server-only secrets ───────────────────────────────── */

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Check .env.local`);
  }
  return value;
}

/** WooCommerce credentials — server-side only. Never import in 'use client' files. */
export function getWCSecrets() {
  return {
    baseUrl: getEnvVar('WC_BASE_URL'),
    consumerKey: getEnvVar('WC_CONSUMER_KEY'),
    consumerSecret: getEnvVar('WC_CONSUMER_SECRET'),
  };
}

/* ── Public config (safe for client & server) ─────────── */

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it',
  freeShippingThreshold: 69,
  defaultShippingCost: 6.5,
  tags: { circuito: 21993, confezioniDa6: 21807, bestSeller: 21806 },
} as const;
