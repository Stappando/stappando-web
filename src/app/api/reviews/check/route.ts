import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

/** Check which products have been reviewed by a specific email */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    const productIds = req.nextUrl.searchParams.get('productIds');

    if (!email || !productIds) {
      return NextResponse.json({ reviewed: {} });
    }

    const ids = productIds.split(',').map(Number).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ reviewed: {} });

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch reviews for each product in parallel (max 20)
    const checks = ids.slice(0, 20).map(async (productId) => {
      try {
        const res = await fetch(
          `${wc.baseUrl}/wp-json/wc/v3/products/reviews?${auth}&product=${productId}&reviewer_email=${encodeURIComponent(email)}&per_page=1`
        );
        if (!res.ok) return { productId, review: null };
        const reviews = await res.json();
        if (reviews.length > 0) {
          return {
            productId,
            review: {
              id: reviews[0].id,
              rating: reviews[0].rating,
              review: reviews[0].review?.replace(/<[^>]+>/g, '') || '',
              date: reviews[0].date_created,
            },
          };
        }
        return { productId, review: null };
      } catch {
        return { productId, review: null };
      }
    });

    const results = await Promise.all(checks);
    const reviewed: Record<number, { id: number; rating: number; review: string; date: string } | null> = {};
    results.forEach(r => { reviewed[r.productId] = r.review; });

    return NextResponse.json({ reviewed });
  } catch {
    return NextResponse.json({ reviewed: {} });
  }
}
