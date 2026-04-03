import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** GET /api/cantine — lists all cantine */
export async function GET(req: NextRequest) {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const pageParam = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const perPage = 24;

  try {
    // ── 1. Fetch ALL pa_produttore terms (WC max per_page=100, so paginate) ──
    type WCTerm = {
      id: number; name: string; slug: string; description: string;
      count: number; image?: { src?: string };
    };
    const terms: WCTerm[] = [];
    let wcPage = 1;
    while (true) {
      const termsRes = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&orderby=count&order=desc&page=${wcPage}&${auth}`,
      );
      if (!termsRes.ok) {
        if (wcPage === 1) {
          console.error('[Cantine] Failed to fetch pa_produttore terms:', termsRes.status);
          return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });
        }
        break;
      }
      const batch: WCTerm[] = await termsRes.json();
      terms.push(...batch);
      const totalPages = parseInt(termsRes.headers.get('X-WP-TotalPages') || '1');
      if (wcPage >= totalPages) break;
      wcPage++;
    }

    // ── 2. producer-logos endpoint for region / banner ───────────────
    // Updated when vendor saves /vendor/negozio or admin saves /admin/vendors.
    // Map: term slug → { region, banner }
    const extraMap = new Map<string, { region: string; banner: string; image: string; address: string }>();
    try {
      const logosRes = await fetch(
        `${wc.baseUrl}/wp-json/stp-app/v1/producer-logos`,
        { cache: 'no-store' },
      );
      if (logosRes.ok) {
        const logos: { name: string; slug: string; image?: string; region?: string; banner?: string; address?: string }[] = await logosRes.json();
        for (const l of logos) {
          const entry = { region: l.region || '', banner: l.banner || '', image: l.image || '', address: l.address || '' };
          if (l.slug) extraMap.set(l.slug, entry);
          if (l.name) extraMap.set(l.name.toLowerCase(), entry);
        }
      }
    } catch { /* non-fatal */ }

    // ── 3. Build cantine list ────────────────────────────────────────
    let allCantine = terms
      .filter(t => t.name && t.count > 0)
      .map(t => {
        const extra = extraMap.get(t.slug) || extraMap.get(t.name.toLowerCase());
        return {
          name: t.name,
          slug: t.slug,
          description: stripHtml(t.description || '').slice(0, 160),
          count: t.count,
          image: t.image?.src || extra?.image || null,
          region: extra?.region || '',
          address: extra?.address || '',
          banner: extra?.banner || null,
        };
      });

    // Filter by region
    const regionFilter = req.nextUrl.searchParams.get('region');
    if (regionFilter) {
      allCantine = allCantine.filter(c => c.region.toLowerCase() === regionFilter.toLowerCase());
    }

    const total = allCantine.length;
    const paginated = allCantine.slice((pageParam - 1) * perPage, pageParam * perPage);
    const regions = [...new Set(allCantine.filter(c => c.region).map(c => c.region))].sort();

    return NextResponse.json(
      { cantine: paginated, total, page: pageParam, hasMore: pageParam * perPage < total, regions },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } },
    );
  } catch (err) {
    console.error('Cantine fetch error:', err);
    return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });
  }
}
