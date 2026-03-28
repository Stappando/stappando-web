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
  producer: string;
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
  async (query: string, limit: number, page: number = 1): Promise<SearchResult[]> => {
    const wc = getWCSecrets();
    const perPage = Math.min(limit, 50);
    const searchParam = query ? `&search=${encodeURIComponent(query)}` : '';
    const url = `${wc.baseUrl}/wp-json/wc/v3/products?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}${searchParam}&per_page=${perPage}&page=${page}&status=publish&orderby=popularity&order=desc&_fields=${WC_FIELDS}`;

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
      const producer = attrs.find(a => a.name === 'Produttore')?.options?.[0] || '';
      const vendor = 'Stappando Enoteca'; // Real vendor set by enrichWithVendors below
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
        producer: decodeHtml(producer),
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
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 50);
  const page = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const onSaleParam = req.nextUrl.searchParams.get('on_sale');
  const tagParam = req.nextUrl.searchParams.get('tag')?.trim();
  const maxPriceParam = req.nextUrl.searchParams.get('max_price');

  // If max_price search (e.g. quotidiani = under 8€)
  if (maxPriceParam && (!q || q.length < 2)) {
    const wc = getWCSecrets();
    const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    const url = `${wc.baseUrl}/wp-json/wc/v3/products?${wcAuth}&max_price=${maxPriceParam}&per_page=${limit}&page=${page}&status=publish&orderby=popularity&order=desc&_fields=${WC_FIELDS}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const products = await res.json();
        return NextResponse.json({ products: mapProducts(products), hasMore: products.length === limit });
      }
    } catch { /* fall through */ }
    return NextResponse.json({ products: [], hasMore: false });
  }

  // If on_sale (optionally combined with category)
  if (onSaleParam === 'true') {
    const wc = getWCSecrets();
    const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    // Resolve category if q is provided
    let catParam = '';
    if (q && q.length >= 2) {
      try {
        const catRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/categories?search=${encodeURIComponent(q)}&per_page=5&${wcAuth}`);
        if (catRes.ok) {
          const cats = await catRes.json();
          const match = cats.find((c: { name: string }) => c.name.toLowerCase() === q.toLowerCase());
          if (match) catParam = `&category=${match.id}`;
        }
      } catch { /* */ }
    }
    const url = `${wc.baseUrl}/wp-json/wc/v3/products?${wcAuth}&on_sale=true${catParam}&per_page=${limit}&page=${page}&status=publish&orderby=popularity&order=desc&_fields=${WC_FIELDS}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const products = await res.json();
        return NextResponse.json({ products: mapProducts(products), hasMore: products.length === limit });
      }
    } catch { /* fall through */ }
    return NextResponse.json({ products: [], hasMore: false });
  }

  // If tag search (e.g. best-seller, quotidiani) — resolve slug to ID first
  if (tagParam && (!q || q.length < 2)) {
    const wc = getWCSecrets();
    const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    // Resolve tag slug to ID
    let tagId = tagParam;
    if (isNaN(Number(tagParam))) {
      try {
        const tagRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/tags?slug=${encodeURIComponent(tagParam)}&${wcAuth}`);
        if (tagRes.ok) {
          const tags = await tagRes.json();
          if (tags[0]?.id) tagId = String(tags[0].id);
        }
      } catch { /* use as-is */ }
    }
    const url = `${wc.baseUrl}/wp-json/wc/v3/products?${wcAuth}&tag=${tagId}&per_page=${limit}&page=${page}&status=publish&orderby=popularity&order=desc&_fields=${WC_FIELDS}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const products = await res.json();
        return NextResponse.json({ products: mapProducts(products), hasMore: products.length === limit });
      }
    } catch { /* fall through */ }
    return NextResponse.json({ products: [], hasMore: false });
  }

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], hasMore: false });
  }

  // Check if q matches a WC category name — if so, search by category ID (much better results)
  const wc2 = getWCSecrets();
  const wcAuth2 = `consumer_key=${wc2.consumerKey}&consumer_secret=${wc2.consumerSecret}`;
  try {
    const catRes = await fetch(`${wc2.baseUrl}/wp-json/wc/v3/products/categories?search=${encodeURIComponent(q)}&per_page=5&${wcAuth2}`);
    if (catRes.ok) {
      const cats = await catRes.json();
      const exactMatch = cats.find((c: { name: string }) => c.name.toLowerCase() === q.toLowerCase());
      if (exactMatch) {
        const catUrl = `${wc2.baseUrl}/wp-json/wc/v3/products?${wcAuth2}&category=${exactMatch.id}&per_page=${limit}&page=${page}&status=publish&orderby=popularity&order=desc&_fields=${WC_FIELDS}`;
        const prodRes = await fetch(catUrl);
        if (prodRes.ok) {
          const products = await prodRes.json();
          return NextResponse.json({ products: mapProducts(products), hasMore: products.length === limit });
        }
      }
    }
  } catch { /* fall through to text search */ }

  const results = await searchProducts(q, limit, page);
  return NextResponse.json({ products: results, hasMore: results.length === limit });
}

/** Map WC products to SearchResult format */
function mapProducts(products: Record<string, unknown>[]): SearchResult[] {
  return products.map((p) => {
    const tags = (p.tags || []) as { id: number; name: string; slug: string }[];
    const attrs = (p.attributes || []) as { name: string; options: string[] }[];
    const meta = (p.meta_data || []) as { key: string; value: string }[];
    const images = (p.images || []) as { src: string }[];
    const isCircuito = tags.some(t => t.id === API_CONFIG.tags.circuito);
    return {
      id: p.id as number,
      slug: p.slug as string,
      name: p.name as string,
      price: p.price as string,
      regular_price: p.regular_price as string,
      sale_price: p.sale_price as string,
      image: images[0]?.src || null,
      producer: decodeHtml(attrs.find(a => a.name === 'Produttore')?.options?.[0] || ''),
      vendor: 'Stappando Enoteca',
      region: decodeHtml(attrs.find(a => a.name === 'Regione')?.options?.[0] || ''),
      on_sale: p.on_sale as boolean,
      is_circuito: isCircuito,
      circuito_badge: meta.find(m => m.key === '_circuito_badge')?.value || '',
    };
  });
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
