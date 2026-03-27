import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** GET /api/vendor/shop?vendorId=123 — fetch vendor shop data (logo, banner, description) */
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
    const meta = (customer.meta_data || []) as { key: string; value: string }[];
    const getMeta = (key: string) => meta.find(m => m.key === key)?.value || '';

    return NextResponse.json({
      logo: getMeta('_vendor_shop_logo'),
      banner: getMeta('_vendor_shop_banner'),
      descrizione: getMeta('_vendor_shop_descrizione'),
    });
  } catch (err) {
    console.error('Vendor shop fetch error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

/** PUT /api/vendor/shop — update vendor shop data */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !isPositiveInt(String(body.vendorId))) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_data: [
          { key: '_vendor_shop_logo', value: sanitize(body.logo || '', 500) },
          { key: '_vendor_shop_banner', value: sanitize(body.banner || '', 500) },
          { key: '_vendor_shop_descrizione', value: sanitize(body.descrizione || '', 2000) },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: 'Errore aggiornamento', details: err }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vendor shop update error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
