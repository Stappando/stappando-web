import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

interface ProducerLogo {
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string;
  region?: string;
  banner?: string;
}

interface ShopData {
  logo: string;
  banner: string;
  descrizione: string;
  regione: string;
  indirizzo: string;
}

/**
 * Build a map of cantinaName.toLowerCase() → ShopData
 * by fetching all vendor customers (WC customers with wcfm_vendor role or _is_vendor meta).
 * This is the authoritative source: vendor saved logo/banner here.
 */
async function buildVendorShopMap(
  baseUrl: string,
  auth: string,
): Promise<Map<string, ShopData>> {
  const map = new Map<string, ShopData>();
  try {
    // Try role=wcfm_vendor first; if empty, fall back to all customers (filter by meta)
    let customers: { first_name: string; shipping?: { company?: string }; meta_data?: { key: string; value: string }[] }[] = [];

    const res = await fetch(`${baseUrl}/wp-json/wc/v3/customers?role=wcfm_vendor&per_page=100&${auth}`);
    if (res.ok) {
      customers = await res.json();
    }

    // Also try customers with _is_vendor meta if we got 0 results
    if (customers.length === 0) {
      const res2 = await fetch(`${baseUrl}/wp-json/wc/v3/customers?per_page=100&${auth}`);
      if (res2.ok) {
        const all: typeof customers = await res2.json();
        customers = all.filter(c =>
          (c.meta_data || []).some(m => m.key === '_is_vendor' && m.value === 'true'),
        );
      }
    }

    for (const c of customers) {
      if (!c.first_name) continue;
      const company = c.shipping?.company || '';
      if (!company.startsWith('{')) continue;
      try {
        const shop = JSON.parse(company) as Partial<ShopData>;
        if (shop.logo || shop.banner || shop.regione) {
          map.set(c.first_name.toLowerCase(), {
            logo: shop.logo || '',
            banner: shop.banner || '',
            descrizione: shop.descrizione || '',
            regione: shop.regione || '',
            indirizzo: shop.indirizzo || '',
          });
        }
      } catch { /* skip malformed JSON */ }
    }
  } catch (e) {
    console.error('[Cantine] buildVendorShopMap error:', e);
  }
  return map;
}

/** GET /api/cantine — lists all cantine with logo/banner */
export async function GET(req: NextRequest) {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const pageParam = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const perPage = 24;

  try {
    // Fetch vendor shop map (authoritative source for logo/banner) in parallel with producer-logos
    const [vendorShopMap, logosResult] = await Promise.allSettled([
      buildVendorShopMap(wc.baseUrl, auth),
      fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos`, { cache: 'no-store' }),
    ]);

    const shopMap = vendorShopMap.status === 'fulfilled' ? vendorShopMap.value : new Map<string, ShopData>();
    console.log(`[Cantine] Vendor shop map loaded: ${shopMap.size} vendors`);

    let allCantine: { name: string; slug: string; description: string; count: number; image: string | null; region: string; banner?: string | null }[] = [];

    // Try producer-logos endpoint
    if (logosResult.status === 'fulfilled' && logosResult.value.ok) {
      const raw = await logosResult.value.json();
      const entries: ProducerLogo[] = Array.isArray(raw) ? raw : Object.values(raw || {});

      allCantine = entries
        .filter(t => t.name)
        .map(t => {
          const vendorKey = t.name.toLowerCase();
          const vendorShop = shopMap.get(vendorKey);
          return {
            name: t.name,
            slug: t.slug,
            description: stripHtml(t.description || vendorShop?.descrizione || '').slice(0, 160),
            count: t.count || 0,
            // Vendor shipping.company is authoritative; producer-logos as fallback
            image: vendorShop?.logo || t.image || null,
            region: vendorShop?.regione || t.region || '',
            banner: vendorShop?.banner || t.banner || null,
          };
        })
        .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
    }

    // Fallback: build entirely from WC attribute terms + vendor shop map
    if (allCantine.length === 0 && shopMap.size > 0) {
      console.log('[Cantine] producer-logos endpoint unavailable — falling back to WC attribute terms');
      try {
        const termsRes = await fetch(
          `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&${auth}`,
        );
        if (termsRes.ok) {
          const terms: { id: number; name: string; slug: string; description: string; count: number; image?: { src?: string } }[] = await termsRes.json();
          allCantine = terms
            .filter(t => t.name && t.count > 0)
            .map(t => {
              const vendorShop = shopMap.get(t.name.toLowerCase());
              return {
                name: t.name,
                slug: t.slug,
                description: stripHtml(vendorShop?.descrizione || t.description || '').slice(0, 160),
                count: t.count || 0,
                image: vendorShop?.logo || t.image?.src || null,
                region: vendorShop?.regione || '',
                banner: vendorShop?.banner || null,
              };
            })
            .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
        }
      } catch (e) {
        console.error('[Cantine] WC terms fallback failed:', e);
      }
    }

    // Filter by region if param provided
    const regionFilter = req.nextUrl.searchParams.get('region');
    if (regionFilter) {
      allCantine = allCantine.filter(c => c.region.toLowerCase() === regionFilter.toLowerCase());
    }

    const total = allCantine.length;
    const paginated = allCantine.slice((pageParam - 1) * perPage, pageParam * perPage);
    const regions = [...new Set(allCantine.filter(c => c.region).map(c => c.region))].sort();

    return NextResponse.json(
      { cantine: paginated, total, page: pageParam, hasMore: pageParam * perPage < total, regions },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } },
    );
  } catch (err) {
    console.error('Cantine fetch error:', err);
    return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });
  }
}
