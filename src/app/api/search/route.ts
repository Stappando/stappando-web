import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets, API_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stappando.it';

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

/** Only request the fields we actually use */
const WC_FIELDS = 'id,slug,name,price,regular_price,sale_price,on_sale,images,attributes,tags,meta_data';

/** Known tag slugs → IDs (avoids extra API call) */
const TAG_MAP: Record<string, number> = {
  'best-seller': API_CONFIG.tags.bestSeller,
  'circuito': API_CONFIG.tags.circuito,
  'occasione': API_CONFIG.tags.occasione,
  'regali': API_CONFIG.tags.regali,
  'confezione-regalo': API_CONFIG.tags.confezioniDa6 || 21807,
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim() || '';
  const tagSlug = sp.get('tag')?.trim() || '';
  const onSale = sp.get('on_sale') === 'true';
  const sort = sp.get('sort') || 'popularity';
  const minPrice = sp.get('min_price') || '';
  const maxPrice = sp.get('max_price') || '';
  const category = sp.get('category') || '';
  const perPage = Math.min(parseInt(sp.get('per_page') || sp.get('limit') || '24'), 50);
  const page = Math.max(parseInt(sp.get('page') || '1'), 1);

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  // Build WC API params
  const params = new URLSearchParams(auth);
  params.set('per_page', String(perPage));
  params.set('page', String(page));
  params.set('status', 'publish');
  params.set('_fields', WC_FIELDS);

  // Sort
  switch (sort) {
    case 'price-asc': params.set('orderby', 'price'); params.set('order', 'asc'); break;
    case 'price-desc': params.set('orderby', 'price'); params.set('order', 'desc'); break;
    case 'date': params.set('orderby', 'date'); params.set('order', 'desc'); break;
    default: params.set('orderby', 'popularity'); params.set('order', 'desc');
  }

  // Filters
  if (onSale) params.set('on_sale', 'true');
  if (minPrice) params.set('min_price', minPrice);
  if (maxPrice) params.set('max_price', maxPrice);

  // Tag resolution: slug → ID
  if (tagSlug) {
    const knownId = TAG_MAP[tagSlug];
    if (knownId) {
      params.set('tag', String(knownId));
    } else if (!isNaN(Number(tagSlug))) {
      params.set('tag', tagSlug);
    } else {
      // Resolve slug → ID from WC
      try {
        const tagRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/tags?slug=${encodeURIComponent(tagSlug)}&${auth}`);
        if (tagRes.ok) {
          const tags = await tagRes.json();
          if (tags[0]?.id) params.set('tag', String(tags[0].id));
        }
      } catch { /* use text search as fallback */ }
    }
  }

  // Category: try to resolve name → ID
  if (category) {
    if (!isNaN(Number(category))) {
      params.set('category', category);
    } else {
      try {
        const catRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/categories?search=${encodeURIComponent(category)}&per_page=5&${auth}`);
        if (catRes.ok) {
          const cats = await catRes.json();
          const match = cats.find((c: { name: string }) => c.name.toLowerCase() === category.toLowerCase());
          if (match) params.set('category', String(match.id));
        }
      } catch { /* */ }
    }
  }

  // Search query: check if it matches a category name first for better results
  if (q && q.length >= 2) {
    let resolvedAsCategory = false;
    if (!params.has('category')) {
      try {
        const catRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/categories?search=${encodeURIComponent(q)}&per_page=5&${auth}`);
        if (catRes.ok) {
          const cats = await catRes.json();
          const exact = cats.find((c: { name: string }) => c.name.toLowerCase() === q.toLowerCase());
          if (exact) {
            params.set('category', String(exact.id));
            resolvedAsCategory = true;
          }
        }
      } catch { /* */ }
    }
    if (!resolvedAsCategory) {
      params.set('search', q);
    }
  }

  // If no query, no tag, no category, no max_price — return popular products
  if (!q && !tagSlug && !category && !maxPrice && !onSale) {
    params.set('orderby', 'popularity');
    params.set('order', 'desc');
  }

  try {
    const url = `${wc.baseUrl}/wp-json/wc/v3/products?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[search] WC error:', res.status);
      return NextResponse.json({ products: [], hasMore: false, total: 0 });
    }

    const products = await res.json();
    const total = parseInt(res.headers.get('x-wp-total') || '0');
    const mapped = mapProducts(products);

    // Enrich with real vendor names
    const enriched = await enrichWithVendors(mapped);

    // Circuito products first (only on popularity sort)
    let final = enriched;
    if (sort === 'popularity' || !sort) {
      const circuito = enriched.filter(p => p.is_circuito);
      const rest = enriched.filter(p => !p.is_circuito);
      final = [...circuito, ...rest];
    }

    return NextResponse.json({
      products: final,
      hasMore: products.length === perPage,
      total,
      page,
    });
  } catch (e) {
    console.error('[search] error:', e);
    return NextResponse.json({ products: [], hasMore: false, total: 0 });
  }
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

/** Enrich search results with real WCFM vendor names */
async function enrichWithVendors(results: SearchResult[]): Promise<SearchResult[]> {
  if (results.length === 0) return results;
  try {
    const ids = results.map(r => r.id);
    const res = await fetch(`${SITE_URL}/wp-json/stp-app/v1/product-vendors?ids=${ids.join(',')}`);
    if (!res.ok) return results;
    const data = await res.json();
    const vendors: Record<string, { vendor_id: string | number; vendor_name: string }> = data.vendors || {};
    await resolveEmailVendorNames(vendors);
    return results.map(r => {
      const v = vendors[String(r.id)];
      if (v?.vendor_name) return { ...r, vendor: v.vendor_name };
      return r;
    });
  } catch { return results; }
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
        if (cantina) v.vendor_name = cantina;
        else if (customer.first_name || customer.last_name) v.vendor_name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      } catch { /* skip */ }
    }),
  );
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–').replace(/&#8230;/g, '…');
}
