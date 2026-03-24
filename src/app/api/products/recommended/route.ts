import { NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

/** Curated product IDs for "consigliati" upsell */
const RECOMMENDED_IDS = [69890, 69817];

export async function GET() {
  try {
    const wc = getWCSecrets();
    const url = `${wc.baseUrl}/wp-json/wc/v3/products?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&include=${RECOMMENDED_IDS.join(',')}&per_page=${RECOMMENDED_IDS.length}&status=publish`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1h
    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const products = await res.json();
    return NextResponse.json(products);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
