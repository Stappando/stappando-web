import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

/** GET /api/cantine/[slug] — fetch single cantina with products */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: 'slug obbligatorio' }, { status: 400 });

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Find the produttore term by slug — try exact slug first, then search by name
    let term = null;
    const termsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?slug=${slug}&${auth}`,
    );
    if (termsRes.ok) {
      const terms = await termsRes.json();
      term = terms[0] || null;
    }
    // Fallback: search all terms for partial slug match
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

    // Fetch logo, region, address from producer-logos endpoint
    let producerLogo = '';
    let producerRegion = '';
    let producerAddress = '';
    let producerBanner = '';
    try {
      const logosRes = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos`, { next: { revalidate: 3600 } });
      if (logosRes.ok) {
        const logos: { name: string; slug: string; image: string; region?: string; address?: string; banner?: string }[] = await logosRes.json();
        const match = logos.find(l => l.slug === term.slug || l.name === term.name);
        if (match) {
          producerLogo = match.image || '';
          producerRegion = match.region || '';
          producerAddress = match.address || '';
          producerBanner = match.banner || '';
        }
      }
    } catch { /* fallback: no logo data */ }

    // Fetch products with this producer attribute
    const productsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products?attribute=pa_produttore&attribute_term=${term.id}&per_page=50&status=publish&${auth}`,
    );

    let products: Record<string, unknown>[] = [];
    if (productsRes.ok) {
      products = await productsRes.json();
    }

    // Get first product image as cantina image
    const firstImage = products[0] && (products[0] as { images?: { src: string }[] }).images?.[0]?.src || null;

    // Map products to frontend format
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
        _vendorName: term.name,
        store: { id: 0, name: term.name, url: '' },
      };
    });

    return NextResponse.json({
      name: term.name,
      slug: term.slug,
      description: term.description || '',
      count: term.count || products.length,
      image: producerLogo || firstImage,
      banner: producerBanner || null,
      region: producerRegion || null,
      address: producerAddress || null,
      products: mappedProducts,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('Cantina detail error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
