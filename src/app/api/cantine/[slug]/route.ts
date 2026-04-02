import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

interface ShopData {
  logo: string;
  banner: string;
  descrizione: string;
  regione: string;
  indirizzo: string;
}

interface WCCustomer {
  id: number;
  first_name: string;
  shipping?: { company?: string };
  billing?: { address_2?: string };
  meta_data?: { key: string; value: string }[];
}

/**
 * Parse shop data from WC customer's shipping.company JSON.
 * Returns null if not present or malformed.
 */
function parseShopData(customer: WCCustomer): ShopData | null {
  const company = customer.shipping?.company || '';
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
  } catch {
    return null;
  }
}

/**
 * Get producer term ID stored in billing.address_2 JSON.
 */
function getTermIdFromCustomer(customer: WCCustomer): string | null {
  try {
    const addr2 = customer.billing?.address_2 || '';
    if (!addr2.startsWith('{')) return null;
    const extra = JSON.parse(addr2) as Record<string, string>;
    return extra._producer_term_id || null;
  } catch {
    return null;
  }
}

/**
 * Get cantina name from meta_data._vendor_cantina or first_name.
 */
function getCantinaName(customer: WCCustomer): string {
  const meta = customer.meta_data || [];
  return meta.find(m => m.key === '_vendor_cantina')?.value || customer.first_name || '';
}

/**
 * Find vendor customer whose shop data matches the given term.
 * Matches by: _producer_term_id (most reliable) > _vendor_cantina meta > first_name.
 */
async function findVendorShop(
  baseUrl: string,
  auth: string,
  termId: number,
  termName: string,
): Promise<ShopData | null> {
  // 1. Search by cantina name — WC searches first_name, last_name, email
  try {
    const searchRes = await fetch(
      `${baseUrl}/wp-json/wc/v3/customers?search=${encodeURIComponent(termName)}&per_page=20&${auth}`,
    );
    if (searchRes.ok) {
      const customers: WCCustomer[] = await searchRes.json();
      // Match on term_id, _vendor_cantina meta, or first_name
      const match = customers.find(c => {
        const tid = getTermIdFromCustomer(c);
        if (tid && parseInt(tid) === termId) return true;
        const cantina = getCantinaName(c);
        return cantina.toLowerCase() === termName.toLowerCase();
      });
      if (match) {
        const shop = parseShopData(match);
        if (shop) {
          console.log(`[Cantine/${termName}] Found vendor ${match.id} via name search`);
          return shop;
        }
      }
    }
  } catch { /* continue to fallback */ }

  // 2. Fetch all vendor customers and match by _producer_term_id
  try {
    const allRes = await fetch(
      `${baseUrl}/wp-json/wc/v3/customers?per_page=100&${auth}`,
    );
    if (allRes.ok) {
      const all: WCCustomer[] = await allRes.json();
      const vendors = all.filter(c =>
        (c.meta_data || []).some(m => m.key === '_is_vendor' && m.value === 'true'),
      );
      const match = vendors.find(c => {
        const tid = getTermIdFromCustomer(c);
        if (tid && parseInt(tid) === termId) return true;
        const cantina = getCantinaName(c);
        return cantina.toLowerCase() === termName.toLowerCase();
      });
      if (match) {
        const shop = parseShopData(match);
        if (shop) {
          console.log(`[Cantine/${termName}] Found vendor ${match.id} via full scan (term_id=${termId})`);
          return shop;
        }
        console.log(`[Cantine/${termName}] Vendor ${match.id} found but shipping.company empty`);
      } else {
        console.log(`[Cantine/${termName}] No vendor match found for term_id=${termId}`);
      }
    }
  } catch (e) {
    console.error(`[Cantine/${termName}] Vendor search failed:`, e);
  }

  return null;
}

/** GET /api/cantine/[slug] — fetch single cantina with products */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: 'slug obbligatorio' }, { status: 400 });

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Find the produttore term by slug
    let term: { id: number; name: string; slug: string; description: string; count: number; image?: { src?: string } } | null = null;
    const termsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?slug=${slug}&${auth}`,
    );
    if (termsRes.ok) {
      const terms = await termsRes.json();
      term = terms[0] || null;
    }
    if (!term) {
      const allRes = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&search=${encodeURIComponent(slug.replace(/-/g, ' '))}&${auth}`,
      );
      if (allRes.ok) {
        const all = await allRes.json();
        term = all.find((t: { slug: string }) => t.slug.startsWith(slug) || t.slug.includes(slug)) || all[0] || null;
      }
    }
    if (!term) return NextResponse.json({ error: 'Cantina non trovata' }, { status: 404 });

    // ── Resolve logo/banner/region/address ──────────────────────────────
    // Priority 1: vendor customer's shipping.company (authoritative)
    // Priority 2: WC native term image (for logo only)
    // Priority 3: producer-logos custom endpoint (fallback)

    let producerLogo = '';
    let producerBanner = '';
    let producerRegion = '';
    let producerAddress = '';
    let producerDescription = '';

    // 1. Find vendor customer by term_id or cantina name
    const vendorShop = await findVendorShop(wc.baseUrl, auth, term.id, term.name);
    if (vendorShop) {
      producerLogo = vendorShop.logo;
      producerBanner = vendorShop.banner;
      producerRegion = vendorShop.regione;
      producerAddress = vendorShop.indirizzo;
      producerDescription = vendorShop.descrizione;
    }

    // 2. WC term image as logo fallback
    if (!producerLogo && term.image?.src) {
      producerLogo = term.image.src;
    }

    // 3. Custom endpoint for any missing data
    if (!producerBanner || !producerRegion || !producerLogo) {
      try {
        const logosRes = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos?nocache=1`, { cache: 'no-store' });
        if (logosRes.ok) {
          const logos: { name: string; slug: string; image: string; region?: string; address?: string; banner?: string }[] = await logosRes.json();
          const match = logos.find(l => l.slug === term!.slug || l.name === term!.name);
          if (match) {
            if (!producerLogo) producerLogo = match.image || '';
            if (!producerBanner) producerBanner = match.banner || '';
            if (!producerRegion) producerRegion = match.region || '';
            if (!producerAddress) producerAddress = match.address || '';
          }
        }
      } catch { /* not fatal */ }
    }

    // ── Fetch products ──────────────────────────────────────────────────
    const productsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products?attribute=pa_produttore&attribute_term=${term.id}&per_page=50&status=publish&${auth}`,
    );
    let products: Record<string, unknown>[] = [];
    if (productsRes.ok) products = await productsRes.json();

    const firstImage = products[0] && (products[0] as { images?: { src: string }[] }).images?.[0]?.src || null;

    const mappedProducts = products.map((p: Record<string, unknown>) => {
      const pi = p as {
        id: number; slug: string; name: string; price: string;
        regular_price: string; sale_price: string; on_sale: boolean;
        images: { id: number; src: string; alt: string }[];
        attributes: { id: number; name: string; options: string[] }[];
        tags: { id: number; name: string; slug: string }[];
        meta_data: { key: string; value: string }[];
        categories: { id: number; name: string; slug: string }[];
        description: string; short_description: string; status: string;
      };
      return {
        id: pi.id, slug: pi.slug, name: pi.name, price: pi.price,
        regular_price: pi.regular_price, sale_price: pi.sale_price, on_sale: pi.on_sale,
        images: pi.images || [], attributes: pi.attributes || [], tags: pi.tags || [],
        meta_data: pi.meta_data || [], categories: pi.categories || [],
        description: pi.description || '', short_description: pi.short_description || '',
        status: pi.status || 'publish',
        _vendorName: term!.name,
        store: { id: 0, name: term!.name, url: '' },
      };
    });

    return NextResponse.json({
      name: term.name,
      slug: term.slug,
      description: producerDescription || term.description || '',
      count: term.count || products.length,
      image: producerLogo || firstImage,
      banner: producerBanner || null,
      region: producerRegion || null,
      address: producerAddress || null,
      products: mappedProducts,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('Cantina detail error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
