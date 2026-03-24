import { NextResponse } from 'next/server';
import { getWCSecrets, API_CONFIG } from '@/lib/config';
import { unstable_cache } from 'next/cache';

/**
 * Lightweight search index — minimal fields for instant client-side filtering.
 * ~100-200 bytes per product → ~200KB for 1000+ products (gzip: ~40KB).
 * Cached 15 min server-side + Cache-Control for CDN/browser.
 */

interface IndexEntry {
  i: number;   // id
  s: string;   // slug
  n: string;   // name (lowercased for search)
  N: string;   // name (original case for display)
  p: string;   // price
  r: string;   // regular_price
  l: string;   // sale_price
  o: boolean;  // on_sale
  v: string;   // vendor
  g: string;   // region
  t: string[]; // tag slugs
  c: boolean;  // is_circuito
  b: string;   // circuito_badge
  m: string;   // image (first, thumbnail URL)
}

const WC_FIELDS = 'id,slug,name,price,regular_price,sale_price,on_sale,images,attributes,tags,meta_data';
const CIRCUITO_TAG = API_CONFIG.tags.circuito;

/** Fetch all published products in pages of 100, returning the slim index */
const buildIndex = unstable_cache(
  async (): Promise<IndexEntry[]> => {
    const wc = getWCSecrets();
    const allProducts: IndexEntry[] = [];
    let page = 1;
    const perPage = 100;

    // Paginate through WC until no more products
    while (true) {
      const url = `${wc.baseUrl}/wp-json/wc/v3/products?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&per_page=${perPage}&page=${page}&status=publish&orderby=popularity&order=desc&_fields=${WC_FIELDS}`;

      const res = await fetch(url);
      if (!res.ok) break;

      const products = await res.json();
      if (!Array.isArray(products) || products.length === 0) break;

      for (const p of products) {
        const tags = (p.tags || []) as { id: number; slug: string }[];
        const attrs = (p.attributes || []) as { name: string; options: string[] }[];
        const meta = (p.meta_data || []) as { key: string; value: string }[];
        const images = (p.images || []) as { src: string }[];

        const name = decodeHtml(String(p.name || ''));
        const vendor = decodeHtml(attrs.find(a => a.name === 'Produttore')?.options?.[0] || '');
        const region = decodeHtml(attrs.find(a => a.name === 'Regione')?.options?.[0] || '');
        const isCircuito = tags.some(t => t.id === CIRCUITO_TAG);
        const badge = meta.find(m => m.key === '_circuito_badge')?.value || '';

        // Use thumbnail if available (smaller), fallback to full
        const img = images[0]?.src || '';
        const thumbImg = img ? img.replace(/(\.[a-z]+)$/i, '-150x150$1') : '';

        allProducts.push({
          i: p.id,
          s: p.slug,
          n: name.toLowerCase(),
          N: name,
          p: p.price || '0',
          r: p.regular_price || '',
          l: p.sale_price || '',
          o: !!p.on_sale,
          v: vendor,
          g: region,
          t: tags.map(t => t.slug),
          c: isCircuito,
          b: badge,
          m: thumbImg || img,
        });
      }

      // If we got fewer than perPage, that's the last page
      if (products.length < perPage) break;
      page++;
    }

    return allProducts;
  },
  ['search-index'],
  { revalidate: 900, tags: ['search-index'] }, // 15 min cache
);

export async function GET() {
  const index = await buildIndex();

  return NextResponse.json(index, {
    headers: {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
    },
  });
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '…');
}
