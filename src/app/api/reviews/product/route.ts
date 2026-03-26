import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) return NextResponse.json({ reviews: [] });

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    const res = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/reviews?${auth}&product=${productId}&per_page=20&status=approved&orderby=date_created&order=desc`
    );

    if (!res.ok) return NextResponse.json({ reviews: [] });

    const data = await res.json();
    const reviews = data.map((r: Record<string, unknown>) => ({
      id: r.id,
      reviewer: r.reviewer || 'Anonimo',
      rating: r.rating || 0,
      review: (r.review as string || '').replace(/<[^>]+>/g, ''),
      date_created: r.date_created || '',
    }));

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
