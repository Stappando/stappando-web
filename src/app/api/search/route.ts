import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets, API_CONFIG } from '@/lib/config';
import { unstable_cache } from 'next/cache';

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

/** Fetch and cache WC search results for 5 minutes */
const searchProducts = unstable_cache(
  async (query: string, limit: number): Promise<SearchResult[]> => {
    const wc = getWCSecrets();
    const url = `${wc.baseUrl}/wp-json/wc/v3/products?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&search=${encodeURIComponent(query)}&per_page=${Math.min(limit + 10, 30)}&status=publish&orderby=popularity&order=desc`;

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

    // Circuito products always first
    const circuito = mapped.filter(p => p.is_circuito);
    const rest = mapped.filter(p => !p.is_circuito);
    return [...circuito, ...rest].slice(0, limit);
  },
  ['search-products'],
  { revalidate: 300, tags: ['search'] }, // 5 min cache
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
