import { NextResponse } from 'next/server';

const SITE_URL = 'https://shop.stappando.it';

export const revalidate = 3600;

/**
 * GET /api/merchant-feed
 * Generates a TSV supplemental feed for Google Merchant Center.
 * Only overrides the `link` field with correct shop.stappando.it URLs.
 */
export async function GET() {
  const wcBase = process.env.WC_BASE_URL || 'https://stappando.it';
  const ck = process.env.WC_CONSUMER_KEY || '';
  const cs = process.env.WC_CONSUMER_SECRET || '';
  const auth = `consumer_key=${ck}&consumer_secret=${cs}`;

  const products: { id: number; slug: string }[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${wcBase}/wp-json/wc/v3/products?status=publish&_fields=id,slug&per_page=100&page=${page}&${auth}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) break;
    const items: { id: number; slug: string }[] = await res.json();
    if (items.length === 0) break;
    products.push(...items);
    if (items.length < 100) break;
    page++;
  }

  const header = 'id\tlink';
  const rows = products.map(
    (p) => `gla_${p.id}\t${SITE_URL}/prodotto/${p.slug}`,
  );
  const tsv = [header, ...rows].join('\n');

  return new NextResponse(tsv, {
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
    },
  });
}
