import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';

function isAuthorized(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const auth = req.headers.get('authorization');
  if (!auth) return false;
  return auth.replace(/^Bearer\s+/i, '') === password;
}

/** GET /api/admin/circuito/search?q=barolo — Search products for circuito panel */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query troppo corta (min 2 caratteri)' }, { status: 400 });
  }

  try {
    const wc = getWCSecrets();
    const url = new URL('/wp-json/wc/v3/products', wc.baseUrl);
    url.searchParams.set('consumer_key', wc.consumerKey);
    url.searchParams.set('consumer_secret', wc.consumerSecret);
    url.searchParams.set('search', q);
    url.searchParams.set('per_page', '10');
    url.searchParams.set('status', 'publish');

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`WC search failed: ${res.status}`);

    const products = await res.json();
    const results = products.map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: ((p.images || []) as { src: string }[])[0]?.src || '',
      tags: ((p.tags || []) as { id: number }[]).map((t) => t.id),
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Circuito search error:', err);
    return NextResponse.json({ error: 'Errore nella ricerca' }, { status: 500 });
  }
}
