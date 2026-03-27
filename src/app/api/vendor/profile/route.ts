import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** GET /api/vendor/profile?vendorId=123 — fetch vendor profile from WC customer meta */
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
      cantina: getMeta('_vendor_cantina') || customer.first_name || '',
      regione: getMeta('_vendor_regione'),
      piva: getMeta('_vendor_piva'),
      telefono: getMeta('_vendor_telefono'),
      sito: getMeta('_vendor_sito'),
      email: customer.email || '',
    });
  } catch (err) {
    console.error('Vendor profile fetch error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

/** PUT /api/vendor/profile — update vendor profile meta */
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
        first_name: sanitize(body.cantina || '', 200),
        meta_data: [
          { key: '_vendor_cantina', value: sanitize(body.cantina || '', 200) },
          { key: '_vendor_regione', value: sanitize(body.regione || '', 100) },
          { key: '_vendor_piva', value: sanitize(body.piva || '', 20) },
          { key: '_vendor_telefono', value: sanitize(body.telefono || '', 30) },
          { key: '_vendor_sito', value: sanitize(body.sito || '', 300) },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: 'Errore aggiornamento', details: err }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vendor profile update error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
