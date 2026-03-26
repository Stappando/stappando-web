import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets, API_CONFIG } from '@/lib/config';
import { unstable_cache } from 'next/cache';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';

export const dynamic = 'force-dynamic';

/** Slim search result — only what the frontend needs */
interface SearchResult {
  id: number;
  slug: string;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  image: string | null;
  vendor: string;
  region: string;
  on_sale: boolean;
  is_circuito: boolean;
  circuito_badge: string;
}

/** Only request the fields we actually use — cuts WC response payload ~70% */
const WC_FIELDS = 'id,slug,name,price,regular_price,sale_price,on_sale,images,attributes,tags,meta_data';

/** Fetch and cache WC search results for 10 minutes */
const searchProducts = unstable_cache(
  async (query: string, limit: number): Promise<SearchResult[]> => {
    const wc = getWCSecrets();
    const url = `${wc.baseUrl}/wp-json/wc/v3/products?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&search=${encodeURIComponent(query)}&per_page=${Math.min(limit + 10, 30)}&status=publish&orderby=popularity&order=desc&_fields=${WC_FIELDS}`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const products = await res.json();
    const CIRCUITO_TAG = API_CONFIG.tags.circuito;

    const mapped: SearchResult[] = products.map((p: Record<string, unknown>) => {
      const tags = (p.tags || []) as { id: number; name: string; slug: string }[];
      const attrs = (p.attributes || []) as { name: string; options: string[] }[];
      const meta = (p.meta_data || []) as { key: string; value: string }[];
      const images = (p.images || []) as { src: string }[];

      const isCircuito = tags.some(t => t.id === CIRCUITO_TAG);
      const vendor = attrs.find(a => a.name === 'Produttore')?.options?.[0] || '';
      const region = attrs.find(a => a.name === 'Regione')?.options?.[0] || '';
      const badge = meta.find(m => m.key === '_circuito_badge')?.value || '';

      return {
        id: p.id as number,
        slug: p.slug as string,
        name: p.name as string,
        price: p.price as string,
        regular_price: p.regular_price as string,
        sale_price: p.sale_price as string,
        image: images[0]?.src || null,
        vendor: decodeHtml(vendor),
        region: decodeHtml(region),
        on_sale: p.on_sale as boolean,
        is_circuito: isCircuito,
        circuito_badge: badge,
      };
    });

    // Enrich with real WCFM vendor data
    const enriched = await enrichWithVendors(mapped);

    // Circuito products always first
    const circuito = enriched.filter(p => p.is_circuito);
    const rest = enriched.filter(p => !p.is_circuito);
    return [...circuito, ...rest].slice(0, limit);
  },
  ['search-products'],
  { revalidate: 600, tags: ['search'] }, // 10 min cache
);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '5'), 20);

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await searchProducts(q, limit);
  return NextResponse.json(results);
}

/** Enrich search results with real WCFM vendor names from product-vendors endpoint */
async function enrichWithVendors(results: SearchResult[]): Promise<SearchResult[]> {
  if (results.length === 0) return results;
  try {
    const ids = results.map(r => r.id);
    const res = await fetch(`${SITE_URL}/wp-json/stp-app/v1/product-vendors?ids=${ids.join(',')}`);
    if (!res.ok) return results;
    const data = await res.json();
    const vendors: Record<string, { vendor_id: string | number; vendor_name: string }> = data.vendors || {};

    // Resolve email-like vendor names to real cantina names
    await resolveEmailVendorNames(vendors);

    return results.map(r => {
      const v = vendors[String(r.id)];
      if (v?.vendor_name) {
        return { ...r, vendor: v.vendor_name };
      }
      return r;
    });
  } catch {
    return results;
  }
}

/** If vendor_name looks like an email, fetch real cantina name from WC customer meta */
async function resolveEmailVendorNames(
  vendors: Record<string, { vendor_id: string | number; vendor_name: string }>,
) {
  const toResolve = Object.values(vendors).filter(
    v => typeof v.vendor_name === 'string' && v.vendor_name.includes('@'),
  );
  if (toResolve.length === 0) return;

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  await Promise.all(
    toResolve.map(async (v) => {
      const userId = String(v.vendor_id).replace('author_', '');
      try {
        const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${userId}?${auth}`);
        if (!res.ok) return;
        const customer = await res.json();
        const meta = (customer.meta_data || []) as { key: string; value: string }[];
        const cantina = meta.find((m: { key: string; value: string }) => m.key === '_vendor_cantina')?.value;
        if (cantina) {
          v.vendor_name = cantina;
        } else if (customer.first_name || customer.last_name) {
          v.vendor_name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }
      } catch { /* skip */ }
    }),
  );
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
