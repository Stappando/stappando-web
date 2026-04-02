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

/**
 * Find the vendor customer whose cantina (first_name) matches the given term name.
 * Returns their shop data from shipping.company JSON, or null if not found.
 */
async function getVendorShopByCantinaName(
  baseUrl: string,
  auth: string,
  cantinaName: string,
): Promise<ShopData | null> {
  try {
    // Search WC customers by cantina name — WC `search` queries first_name, last_name, email
    const res = await fetch(
      `${baseUrl}/wp-json/wc/v3/customers?search=${encodeURIComponent(cantinaName)}&per_page=10&${auth}`,
    );
    if (!res.ok) return null;
    const customers: { first_name: string; shipping?: { company?: string } }[] = await res.json();

    // Find exact match on first_name (cantina name)
    const vendor = customers.find(
      (c) => c.first_name?.toLowerCase() === cantinaName.toLowerCase(),
    );
    if (!vendor) return null;

    const company = vendor.shipping?.company || '';
    if (!company.startsWith('{')) return null;

    try {
      const shop = JSON.parse(company) as Partial<ShopData>;
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
  } catch {
    return null;
  }
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
    // Fallback: search by name
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

    // ── Resolve logo/banner/region/address ──────────────────
    // Priority: vendor's shipping.company JSON (direct WC storage) > WC term image > producer-logos custom endpoint
    let producerLogo = '';
    let producerBanner = '';
    let producerRegion = '';
    let producerAddress = '';
    let producerDescription = '';

    // 1. Read directly from vendor customer's shipping.company — most reliable source
    const vendorShop = await getVendorShopByCantinaName(wc.baseUrl, auth, term.name);
    if (vendorShop) {
      producerLogo = vendorShop.logo;
      producerBanner = vendorShop.banner;
      producerRegion = vendorShop.regione;
      producerAddress = vendorShop.indirizzo;
      producerDescription = vendorShop.descrizione;
      console.log(`[Cantine/${slug}] Loaded shop from vendor customer (logo=${!!producerLogo}, banner=${!!producerBanner})`);
    }

    // 2. Fall back to WC native term image for logo (set when vendor/admin saves shop)
    if (!producerLogo && term.image?.src) {
      producerLogo = term.image.src;
      console.log(`[Cantine/${slug}] Using WC term image as logo fallback`);
    }

    // 3. Try custom endpoint for any still-missing data (banner, region, address)
    if (!producerBanner || !producerRegion) {
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

    // ── Fetch products ──────────────────────────────────────
    const productsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products?attribute=pa_produttore&attribute_term=${term.id}&per_page=50&status=publish&${auth}`,
    );
    let products: Record<string, unknown>[] = [];
    if (productsRes.ok) {
      products = await productsRes.json();
    }

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
        id: pi.id,
        slug: pi.slug,
        name: pi.name,
        price: pi.price,
        regular_price: pi.regular_price,
        sale_price: pi.sale_price,
        on_sale: pi.on_sale,
        images: pi.images || [],
        attributes: pi.attributes || [],
        tags: pi.tags || [],
        meta_data: pi.meta_data || [],
        categories: pi.categories || [],
        description: pi.description || '',
        short_description: pi.short_description || '',
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
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('Cantina detail error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
