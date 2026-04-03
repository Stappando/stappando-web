/**
 * Bulk update producer regions/addresses via stp-app/v1/update-producer-meta.
 * POST /api/admin/bulk-regions
 * Body: { adminPassword, producers: [{ slug, region, address? }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Body non valido' }, { status: 400 });

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || body.adminPassword !== adminPassword) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const producers: { slug: string; region: string; address?: string }[] = body.producers || [];
    if (!producers.length) return NextResponse.json({ error: 'No producers' }, { status: 400 });

    const wc = getWCSecrets();
    const wcAuth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch all terms to map slug → id
    const terms: { id: number; slug: string }[] = [];
    let page = 1;
    while (true) {
      const res = await fetch(
        `${wc.baseUrl}/wp-json/wc/v3/products/attributes/10/terms?per_page=100&page=${page}&${wcAuth}`,
      );
      if (!res.ok) break;
      const batch = await res.json();
      terms.push(...batch);
      const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
      if (page >= totalPages) break;
      page++;
    }

    const slugMap = new Map(terms.map(t => [t.slug, t.id]));

    const wpUser = process.env.WP_ADMIN_USER || process.env.WP_USER;
    const wpPass = process.env.WP_ADMIN_APP_PASSWORD || process.env.WP_APP_PASSWORD;
    if (!wpUser || !wpPass) {
      return NextResponse.json({ error: 'WP credentials not configured' }, { status: 500 });
    }
    const wpAuth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');

    let updated = 0;
    let notFound = 0;
    let failed = 0;

    for (const p of producers) {
      const termId = slugMap.get(p.slug);
      if (!termId) { notFound++; continue; }

      try {
        const res = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/update-producer-meta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Basic ${wpAuth}` },
          body: JSON.stringify({ term_id: termId, region: p.region, address: p.address || '' }),
        });
        if (res.ok) updated++;
        else failed++;
      } catch { failed++; }
    }

    return NextResponse.json({ updated, notFound, failed, total: producers.length });
  } catch (err) {
    console.error('[bulk-regions] Error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
