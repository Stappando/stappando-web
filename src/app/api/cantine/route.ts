import { NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

interface CantineEntry {
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string | null;
}

/** GET /api/cantine — fast endpoint for cantine page */
export async function GET() {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Fetch all produttore terms from WC (fast, no product data needed)
    const res = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&${auth}`,
    );
    if (!res.ok) return NextResponse.json([], { status: 200 });

    const terms: { id: number; name: string; slug: string; description: string; count: number }[] = await res.json();

    // Filter out terms with 0 products, sort by count desc
    const cantine: CantineEntry[] = terms
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(t => ({
        name: t.name,
        slug: t.slug,
        description: (t.description || '').slice(0, 160),
        count: t.count,
        image: null, // Will try to get from term meta
      }));

    // Try to get logo images from term meta (thumbnail_id)
    // WC doesn't expose term meta directly, so we check if there's a custom endpoint
    // For now, fetch first product image per producer for the top 20
    const top20 = cantine.slice(0, 40);
    const imagePromises = top20.map(async (cantina) => {
      try {
        const prodRes = await fetch(
          `${wc.baseUrl}/wp-json/wc/v3/products?attribute=pa_produttore&attribute_term=${encodeURIComponent(cantina.name)}&per_page=1&${auth}`,
        );
        if (prodRes.ok) {
          const products = await prodRes.json();
          if (products[0]?.images?.[0]?.src) {
            cantina.image = products[0].images[0].src;
          }
        }
      } catch { /* ignore */ }
    });

    await Promise.all(imagePromises);

    return NextResponse.json(cantine, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
    });
  } catch (err) {
    console.error('Cantine fetch error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
