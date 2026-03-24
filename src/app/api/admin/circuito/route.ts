import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets, API_CONFIG } from '@/lib/config';

const CIRCUITO_TAG_ID = API_CONFIG.tags.circuito;
const MAX_CIRCUITO = 10;

/** Verify admin password from Authorization header */
function isAuthorized(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const auth = req.headers.get('authorization');
  if (!auth) return false;
  // Support "Bearer <password>" format
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === password;
}

function wcUrl(path: string, params?: Record<string, string | number>): string {
  const wc = getWCSecrets();
  const url = new URL(`/wp-json/wc/v3${path}`, wc.baseUrl);
  url.searchParams.set('consumer_key', wc.consumerKey);
  url.searchParams.set('consumer_secret', wc.consumerSecret);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  return url.toString();
}

/** GET — List all circuito products */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    // Fetch products with circuito tag
    const res = await fetch(wcUrl('/products', {
      tag: String(CIRCUITO_TAG_ID),
      per_page: 20,
      status: 'publish',
    }), { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`WC API error: ${res.status}`);
    }

    const products = await res.json();

    // Extract circuito metadata from each product
    const circuitoProducts = products.map((p: Record<string, unknown>) => {
      const meta = (p.meta_data || []) as { key: string; value: string }[];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        on_sale: p.on_sale,
        image: ((p.images || []) as { src: string }[])[0]?.src || '',
        stock_status: p.stock_status,
        circuito_priority: parseInt(meta.find((m) => m.key === '_circuito_priority')?.value || '99', 10),
        circuito_badge: meta.find((m) => m.key === '_circuito_badge')?.value || 'Selezionato dal Sommelier',
      };
    });

    // Sort by priority
    circuitoProducts.sort((a: { circuito_priority: number }, b: { circuito_priority: number }) => a.circuito_priority - b.circuito_priority);

    return NextResponse.json({
      products: circuitoProducts,
      count: circuitoProducts.length,
      max: MAX_CIRCUITO,
    });
  } catch (err) {
    console.error('Circuito GET error:', err);
    return NextResponse.json({ error: 'Errore nel caricamento prodotti circuito' }, { status: 500 });
  }
}

/** POST — Add product to circuito or update circuito settings */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, priority = 99, badge = 'Selezionato dal Sommelier' } = body;

    if (!productId || typeof productId !== 'number') {
      return NextResponse.json({ error: 'productId richiesto' }, { status: 400 });
    }

    // Check current count
    const countRes = await fetch(wcUrl('/products', {
      tag: String(CIRCUITO_TAG_ID),
      per_page: 1,
      status: 'publish',
    }), {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    const totalHeader = countRes.headers.get('x-wp-total');
    const currentCount = parseInt(totalHeader || '0', 10);

    // Check if product already has the tag
    const productRes = await fetch(wcUrl(`/products/${productId}`), { cache: 'no-store' });
    if (!productRes.ok) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
    }
    const product = await productRes.json();
    const existingTags: { id: number }[] = product.tags || [];
    const alreadyCircuito = existingTags.some((t) => t.id === CIRCUITO_TAG_ID);

    if (!alreadyCircuito && currentCount >= MAX_CIRCUITO) {
      return NextResponse.json({
        error: `Massimo ${MAX_CIRCUITO} prodotti circuito. Rimuovine uno prima.`,
      }, { status: 400 });
    }

    // Update product: add tag + set meta
    const tags = alreadyCircuito ? existingTags : [...existingTags, { id: CIRCUITO_TAG_ID }];

    const updateRes = await fetch(wcUrl(`/products/${productId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags,
        meta_data: [
          { key: '_circuito_priority', value: String(Math.max(1, Math.min(99, priority))) },
          { key: '_circuito_badge', value: String(badge).slice(0, 60) },
        ],
      }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(`WC update failed: ${updateRes.status} ${JSON.stringify(err)}`);
    }

    return NextResponse.json({ success: true, action: alreadyCircuito ? 'updated' : 'added' });
  } catch (err) {
    console.error('Circuito POST error:', err);
    return NextResponse.json({ error: 'Errore nell\'aggiornamento' }, { status: 500 });
  }
}

/** DELETE — Remove product from circuito */
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId || typeof productId !== 'number') {
      return NextResponse.json({ error: 'productId richiesto' }, { status: 400 });
    }

    // Get current product tags
    const productRes = await fetch(wcUrl(`/products/${productId}`), { cache: 'no-store' });
    if (!productRes.ok) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
    }
    const product = await productRes.json();
    const tags: { id: number }[] = (product.tags || []).filter((t: { id: number }) => t.id !== CIRCUITO_TAG_ID);

    // Remove tag + clear meta
    const updateRes = await fetch(wcUrl(`/products/${productId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags,
        meta_data: [
          { key: '_circuito_priority', value: '' },
          { key: '_circuito_badge', value: '' },
        ],
      }),
    });

    if (!updateRes.ok) {
      throw new Error(`WC update failed: ${updateRes.status}`);
    }

    return NextResponse.json({ success: true, action: 'removed' });
  } catch (err) {
    console.error('Circuito DELETE error:', err);
    return NextResponse.json({ error: 'Errore nella rimozione' }, { status: 500 });
  }
}
