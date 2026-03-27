import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** GET /api/vendor/reviews?vendorId=123 — fetch reviews for vendor's products */
export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get('vendorId');
  if (!isPositiveInt(vendorId)) {
    return NextResponse.json({ error: 'vendorId obbligatorio' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Fetch vendor's products first (by author)
    const wpRes = await fetch(`${wc.baseUrl}/wp-json/wp/v2/product?author=${vendorId}&per_page=100&_fields=id,title`);
    if (!wpRes.ok) return NextResponse.json([], { status: 200 });

    const products: { id: number; title: { rendered: string } }[] = await wpRes.json();
    if (products.length === 0) return NextResponse.json([], { status: 200 });

    // Fetch reviews for these products
    const productIds = products.map(p => p.id);
    const productNames = new Map(products.map(p => [p.id, p.title.rendered]));

    const reviewsRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/reviews?product=${productIds.join(',')}&per_page=50&${auth}`,
    );
    if (!reviewsRes.ok) return NextResponse.json([], { status: 200 });

    const reviews = await reviewsRes.json();

    return NextResponse.json(
      reviews.map((r: Record<string, unknown>) => ({
        id: r.id,
        product_name: productNames.get(r.product_id as number) || 'Prodotto',
        reviewer: r.reviewer || 'Anonimo',
        rating: r.rating || 0,
        review: r.review || '',
        date_created: r.date_created || '',
      })),
    );
  } catch (err) {
    console.error('Vendor reviews fetch error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
