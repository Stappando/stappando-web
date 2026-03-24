/**
 * Coupon generation and management — server-side only.
 * Creates WooCommerce coupons and tracks them via customer meta.
 */

import { getWCSecrets } from '@/lib/config';

function randomCode(len: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for readability
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function expiresIn30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

interface GenerateCouponParams {
  type: 'welcome' | 'second';
  firstName: string;
  email: string;
  customerId: number;
}

interface CouponResult {
  code: string;
  expires: string;
}

/** Create a WooCommerce coupon and save meta on customer */
export async function generateCoupon(params: GenerateCouponParams): Promise<CouponResult> {
  const wc = getWCSecrets();
  const authParams = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  const prefix = params.type === 'welcome' ? 'BENVENUTO' : 'GRAZIE';
  const name = params.firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 12) || 'CLIENTE';
  const code = `${prefix}-${name}-${randomCode(4)}`;
  const expires = expiresIn30Days();

  // 1. Create WC coupon
  const couponRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/coupons?${authParams}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      discount_type: 'percent',
      amount: '5',
      individual_use: true,
      usage_limit: 1,
      usage_limit_per_user: 1,
      date_expires: expires,
      email_restrictions: [params.email],
      description: `Coupon ${prefix.toLowerCase()} - ${params.firstName} ${new Date().toLocaleDateString('it-IT')}`,
    }),
  });

  if (!couponRes.ok) {
    const err = await couponRes.json().catch(() => ({}));
    throw new Error(`WC coupon creation failed: ${couponRes.status} ${JSON.stringify(err)}`);
  }

  // 2. Save meta on customer
  const metaPrefix = params.type === 'welcome' ? '_coupon1' : '_coupon2';
  const metaData = [
    { key: `${metaPrefix}_code`, value: code },
    { key: `${metaPrefix}_expires`, value: expires },
    { key: `${metaPrefix}_used`, value: 'false' },
    { key: `${metaPrefix}_used_at`, value: '' },
  ];

  await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${params.customerId}?${authParams}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meta_data: metaData }),
  });

  console.log(`Coupon generated: ${code} for ${params.email} (${params.type})`);
  return { code, expires };
}

/** Mark a coupon as used on the customer meta */
export async function markCouponUsed(customerId: number, type: 'welcome' | 'second'): Promise<void> {
  const wc = getWCSecrets();
  const authParams = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const metaPrefix = type === 'welcome' ? '_coupon1' : '_coupon2';

  await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${customerId}?${authParams}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meta_data: [
        { key: `${metaPrefix}_used`, value: 'true' },
        { key: `${metaPrefix}_used_at`, value: new Date().toISOString() },
      ],
    }),
  });
}

/** Check if an order used a specific coupon code prefix */
export function orderUsedCouponPrefix(order: { coupon_lines?: { code: string }[] }, prefix: string): boolean {
  if (!order.coupon_lines) return false;
  return order.coupon_lines.some(c => c.code.toUpperCase().startsWith(prefix));
}

/** Get customer meta values for coupon tracking */
export async function getCustomerCouponMeta(customerId: number): Promise<Record<string, string>> {
  const wc = getWCSecrets();
  const authParams = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${customerId}?${authParams}`);
  if (!res.ok) return {};

  const customer = await res.json();
  const meta: Record<string, string> = {};
  for (const m of (customer.meta_data || [])) {
    if (typeof m.key === 'string' && m.key.startsWith('_coupon')) {
      meta[m.key] = String(m.value || '');
    }
  }
  return meta;
}
