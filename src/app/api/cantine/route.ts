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

interface VendorCustomer {
  id: number;
  first_name: string;
  shipping?: { company?: string };
  billing?: { address_2?: string };
  meta_data?: { key: string; value: string }[];
}

function getCantinaKey(c: VendorCustomer): string {
  // _vendor_cantina meta is the authoritative cantina name
  const metaCantina = (c.meta_data || []).find(m => m.key === '_vendor_cantina')?.value;
  return (metaCantina || c.first_name || '').toLowerCase();
}

function getTermId(c: VendorCustomer): string | null {
  try {
    const addr2 = c.billing?.address_2 || '';
    if (!addr2.startsWith('{')) return null;
    return (JSON.parse(addr2) as Record<string, string>)._producer_term_id || null;
  } catch { return null; }
}

function parseShop(c: VendorCustomer): ShopData | null {
  const company = c.shipping?.company || '';
  if (!company.startsWith('{')) return null;
  try {
    const shop = JSON.parse(company) as Partial<ShopData>;
    if (!shop.logo && !shop.banner && !shop.regione && !shop.indirizzo && !shop.descrizione) return null;
    return {
      logo: shop.logo || '',
      banner: shop.banner || '',
      descrizione: shop.descrizione || '',
      regione: shop.regione || '',
      indirizzo: shop.indirizzo || '',
    };
  } catch { return null; }
}

/**
 * Build two maps from vendor customers:
 * - byName: cantinaName.toLowerCase() → ShopData
 * - byTermId: termId → ShopData
 */
async function buildVendorShopMap(
  baseUrl: string,
  auth: string,
): Promise<{ byName: Map<string, ShopData>; byTermId: Map<string, ShopData> }> {
  const byName = new Map<string, ShopData>();
  const byTermId = new Map<string, ShopData>();

  try {
    // Fetch all customers and filter for vendors
    const res = await fetch(`${baseUrl}/wp-json/wc/v3/customers?per_page=100&${auth}`);
    if (!res.ok) return { byName, byTermId };

    const all: VendorCustomer[] = await res.json();
    const vendors = all.filter(c =>
      (c.meta_data || []).some(m => m.key === '_is_vendor' && m.value === 'true'),
    );

    console.log(`[Cantine] Found ${vendors.length} vendor customers`);

    for (const c of vendors) {
      const shop = parseShop(c);
      if (!shop) continue;

      const key = getCantinaKey(c);
      if (key) byName.set(key, shop);

      const tid = getTermId(c);
      if (tid) byTermId.set(tid, shop);
    }
  } catch (e) {
    console.error('[Cantine] buildVendorShopMap error:', e);
  }
  return { byName, byTermId };
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

    const { byName: shopByName, byTermId: shopByTermId } = vendorShopMap.status === 'fulfilled'
      ? vendorShopMap.value
      : { byName: new Map<string, ShopData>(), byTermId: new Map<string, ShopData>() };
    console.log(`[Cantine] Vendor shop map: ${shopByName.size} by name, ${shopByTermId.size} by termId`);

    let allCantine: { name: string; slug: string; description: string; count: number; image: string | null; region: string; banner?: string | null }[] = [];

    // Try producer-logos endpoint
    if (logosResult.status === 'fulfilled' && logosResult.value.ok) {
      const raw = await logosResult.value.json();
      const entries: ProducerLogo[] = Array.isArray(raw) ? raw : Object.values(raw || {});

      allCantine = entries
        .filter(t => t.name)
        .map(t => {
          // Match vendor by name (from _vendor_cantina meta) OR by slug match
          const vendorShop = shopByName.get(t.name.toLowerCase()) || shopByName.get(t.slug.replace(/-/g, ' ').toLowerCase());
          return {
            name: t.name,
            slug: t.slug,
            description: stripHtml(vendorShop?.descrizione || t.description || '').slice(0, 160),
            count: t.count || 0,
            image: vendorShop?.logo || t.image || null,
            region: vendorShop?.regione || t.region || '',
            banner: vendorShop?.banner || (t as ProducerLogo & { banner?: string }).banner || null,
          };
        })
        .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
    }

    // Fallback: build entirely from WC attribute terms + vendor shop map
    if (allCantine.length === 0 && shopByName.size > 0) {
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
              const vendorShop = shopByName.get(t.name.toLowerCase()) || shopByTermId.get(String(t.id));
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
