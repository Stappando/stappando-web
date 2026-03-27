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
    // Find the produttore term by slug
    const termsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?slug=${slug}&${auth}`,
    );
    if (!termsRes.ok) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

    const terms = await termsRes.json();
    if (!terms[0]) return NextResponse.json({ error: 'Cantina non trovata' }, { status: 404 });

    const term = terms[0];

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
      image: firstImage,
      products: mappedProducts,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('Cantina detail error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
