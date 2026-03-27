import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

interface ProducerLogo {
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string;
}

/** GET /api/cantine — uses WP producer-logos endpoint (fast, has real logos) */
export async function GET(req: NextRequest) {
  const wc = getWCSecrets();
  const pageParam = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const perPage = 24;

  try {
    // Fetch from the custom WP endpoint with real swatch logos
    const res = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos`);
    if (!res.ok) return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });

    const raw: Record<string, ProducerLogo> = await res.json();

    // Convert to array, filter count > 0, sort by count desc
    let allCantine = Object.values(raw)
      .filter(t => t.count > 0)
      .map(t => ({
        name: t.name,
        slug: t.slug,
        description: stripHtml(t.description || '').slice(0, 160),
        count: t.count,
        image: t.image || null,
        region: '', // will be enriched below for paginated set
      }))
      .sort((a, b) => b.count - a.count);

    const total = allCantine.length;
    const paginated = allCantine.slice((pageParam - 1) * perPage, pageParam * perPage);

    // Enrich with region from first product (only for current page)
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    await Promise.all(
      paginated.map(async (c) => {
        try {
          const prodRes = await fetch(
            `${wc.baseUrl}/wp-json/wc/v3/products?attribute=pa_produttore&attribute_term=${encodeURIComponent(c.name)}&per_page=1&status=publish&_fields=attributes&${auth}`,
          );
          if (prodRes.ok) {
            const prods = await prodRes.json();
            if (prods[0]) {
              const regionAttr = prods[0].attributes?.find((a: { name: string }) => a.name === 'Regione');
              c.region = regionAttr?.options?.[0] || '';
            }
          }
        } catch { /* skip */ }
      }),
    );

    return NextResponse.json(
      { cantine: paginated, total, page: pageParam, hasMore: pageParam * perPage < total },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } },
    );
  } catch (err) {
    console.error('Cantine fetch error:', err);
    return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });
  }
}
