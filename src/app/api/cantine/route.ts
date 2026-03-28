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
  region?: string;
}

/** GET /api/cantine — uses WP producer-logos endpoint (fast, has real logos) */
export async function GET(req: NextRequest) {
  const wc = getWCSecrets();
  const pageParam = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const perPage = 24;

  try {
    // Fetch from the custom WP endpoint with real swatch logos
    const res = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/producer-logos`, { cache: 'no-store' });
    if (!res.ok) {
      console.error('Producer logos fetch failed:', res.status);
      return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });
    }

    const raw = await res.json();
    console.log('Producer logos: type=', typeof raw, 'isArray=', Array.isArray(raw), 'keys=', Object.keys(raw || {}).length);

    // Handle both object {id: {...}} and array formats
    const entries: ProducerLogo[] = Array.isArray(raw) ? raw : Object.values(raw || {});

    // Convert to array, sort by count or name
    let allCantine = entries
      .filter(t => t.name)
      .map(t => ({
        name: t.name,
        slug: t.slug,
        description: stripHtml(t.description || '').slice(0, 160),
        count: t.count || 0,
        image: t.image || null,
        region: t.region || '',
      }))
      .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));

    // Filter by region if param provided
    const regionFilter = req.nextUrl.searchParams.get('region');
    if (regionFilter) {
      allCantine = allCantine.filter(c => c.region.toLowerCase() === regionFilter.toLowerCase());
    }

    const total = allCantine.length;
    const paginated = allCantine.slice((pageParam - 1) * perPage, pageParam * perPage);

    // Collect unique regions for filter dropdown
    const regions = [...new Set(entries.filter(t => t.region).map(t => t.region))].sort();

    return NextResponse.json(
      { cantine: paginated, total, page: pageParam, hasMore: pageParam * perPage < total, regions },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } },
    );
  } catch (err) {
    console.error('Cantine fetch error:', err);
    return NextResponse.json({ cantine: [], total: 0, page: 1, hasMore: false });
  }
}
