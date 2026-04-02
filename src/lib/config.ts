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

export const DEFAULT_VENDOR_NAME = 'Stappando Enoteca';

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it',
  freeShippingThreshold: 69,
  defaultShippingCost: 6.5,
  tags: { circuito: 21993, confezioniDa6: 21807, bestSeller: 21806, occasione: 21995, regali: 21996 },
} as const;

/** WordPress Application Password credentials — for ticket system and WP REST API */
export function getWPAdminAuth(): { authHeader: string; baseUrl: string } | null {
  const user = process.env.WP_ADMIN_USER;
  const pass = process.env.WP_ADMIN_APP_PASSWORD;
  const wc = getWCSecrets();
  if (!user || !pass) return null;
  const authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  return { authHeader, baseUrl: wc.baseUrl };
}

/** WP ticket category ID (create one manually in WP and set this env var) */
export function getTicketCategoryId(): number {
  return parseInt(process.env.WP_TICKET_CATEGORY_ID || '0', 10);
}
