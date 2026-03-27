import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** GET /api/vendor/products?vendorId=123 — fetch products authored by vendor */
export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get('vendorId');
  if (!isPositiveInt(vendorId)) {
    return NextResponse.json({ error: 'vendorId obbligatorio' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // WC REST API doesn't support filtering by author directly,
    // so we use the WordPress REST API to find products by author
    const wpRes = await fetch(
      `${wc.baseUrl}/wp-json/wp/v2/product?author=${vendorId}&per_page=50&status=any&_fields=id`,
    );

    if (!wpRes.ok) {
      // Fallback: fetch all recent products and filter by checking post_author
      // This is less efficient but works without WP REST for products
      const wcRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products?per_page=50&${auth}`);
      if (!wcRes.ok) return NextResponse.json([], { status: 200 });
      const allProducts = await wcRes.json();
      // Can't filter by author with WC API, return empty for now
      return NextResponse.json(allProducts.slice(0, 0), { status: 200 });
    }

    const wpProducts: { id: number }[] = await wpRes.json();
    if (wpProducts.length === 0) return NextResponse.json([], { status: 200 });

    // Fetch full product data from WC API for each product
    const productIds = wpProducts.map(p => p.id);
    const includeParam = productIds.join(',');
    const wcRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products?include=${includeParam}&per_page=50&${auth}`,
    );

    if (!wcRes.ok) return NextResponse.json([], { status: 200 });
    const products = await wcRes.json();

    return NextResponse.json(
      products.map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        price: (p as { regular_price?: string }).regular_price || '',
        sale_price: (p as { sale_price?: string }).sale_price || '',
        stock_quantity: (p as { stock_quantity?: number | null }).stock_quantity,
        images: ((p as { images?: { src: string }[] }).images || []).slice(0, 1),
        categories: ((p as { categories?: { name: string }[] }).categories || []).slice(0, 2),
      })),
    );
  } catch (err) {
    console.error('Vendor products fetch error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
