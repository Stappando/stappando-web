import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** GET /api/cantine — fast endpoint, supports pagination + region filter */
export async function GET(req: NextRequest) {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const pageParam = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const perPage = 24;
  const search = req.nextUrl.searchParams.get('search')?.trim() || '';

  try {
    // Fetch produttore terms (paginated)
    let url = `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&orderby=count&order=desc&${auth}`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });

    let allTerms: { id: number; name: string; slug: string; description: string; count: number }[] = await res.json();

    // Filter by count > 0
    allTerms = allTerms.filter(t => t.count > 0);

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      allTerms = allTerms.filter(t => t.name.toLowerCase().includes(q) || stripHtml(t.description).toLowerCase().includes(q));
    }

    const total = allTerms.length;
    const paginated = allTerms.slice((pageParam - 1) * perPage, pageParam * perPage);

    // For each term, get first product to extract region + image
    const cantine = await Promise.all(
      paginated.map(async (t) => {
        let image: string | null = null;
        let region = '';
        try {
          const prodRes = await fetch(
            `${wc.baseUrl}/wp-json/wc/v3/products?attribute=pa_produttore&attribute_term=${t.id}&per_page=1&status=publish&_fields=images,attributes&${auth}`,
          );
          if (prodRes.ok) {
            const prods = await prodRes.json();
            if (prods[0]) {
              image = prods[0].images?.[0]?.src || null;
              const regionAttr = prods[0].attributes?.find((a: { name: string }) => a.name === 'Regione');
              region = regionAttr?.options?.[0] || '';
            }
          }
        } catch { /* skip */ }

        return {
          name: t.name,
          slug: t.slug,
          description: stripHtml(t.description).slice(0, 160),
          count: t.count,
          image,
          region,
        };
      }),
    );

    return NextResponse.json(
      { cantine, total, page: pageParam, hasMore: pageParam * perPage < total },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } },
    );
  } catch (err) {
    console.error('Cantine fetch error:', err);
    return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });
  }
}
