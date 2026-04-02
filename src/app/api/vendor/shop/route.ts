import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';
import { syncShopToProducerTerm } from '@/lib/vendor/sync-producer-term';

export const dynamic = 'force-dynamic';

/** GET /api/vendor/shop?vendorId=123 */
export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get('vendorId');
  if (!isPositiveInt(vendorId)) {
    return NextResponse.json({ error: 'vendorId obbligatorio' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`);
    if (!res.ok) return NextResponse.json({ error: 'Vendor non trovato' }, { status: 404 });

    const customer = await res.json();
    const s = customer.shipping || {};

    let shop = { logo: '', banner: '', descrizione: '', regione: '', indirizzo: '' };
    try {
      if (s.company && s.company.startsWith('{')) {
        shop = { ...shop, ...JSON.parse(s.company) };
      }
    } catch { /* not JSON */ }

    return NextResponse.json(shop);
  } catch (err) {
    console.error('Vendor shop fetch error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

/** PUT /api/vendor/shop */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !isPositiveInt(String(body.vendorId))) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    const shopData = {
      logo: sanitize(body.logo || '', 500),
      banner: sanitize(body.banner || '', 500),
      descrizione: sanitize(body.descrizione || '', 2000),
      regione: sanitize(body.regione || '', 100),
      indirizzo: sanitize(body.indirizzo || '', 300),
    };

    // 1. Save to WC customer shipping.company (source for vendor's own negozio page)
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping: { company: JSON.stringify(shopData) } }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('WC shop update failed:', res.status, err);
      return NextResponse.json({ error: `Errore WC (${res.status})` }, { status: res.status });
    }

    // 2. Sync to pa_produttore term — logo + description (WC native) + banner/region/address (term meta)
    // This is what cantine pages read from — runs async, non-blocking for the user
    syncShopToProducerTerm({ vendorId: body.vendorId, shopData }).catch(e =>
      console.error('syncShopToProducerTerm failed:', e),
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vendor shop update error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
