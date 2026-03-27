import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const META_KEYS = [
  'cantina', 'nome', 'cognome', 'telefono', 'sito',
  'ragioneSociale', 'piva', 'codiceFiscale', 'pec', 'sdi',
  'indirizzo', 'citta', 'provincia', 'cap', 'regione',
  'indirizzoEsperienze',
  'iban', 'intestazioneIban',
] as const;

/** GET /api/vendor/profile?vendorId=123 */
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
    const getMeta = (key: string) => meta.find(m => m.key === `_vendor_${key}`)?.value || '';

    const profile: Record<string, string> = { email: customer.email || '' };
    for (const key of META_KEYS) {
      profile[key] = getMeta(key);
    }
    // Fallback: cantina from first_name if meta empty
    if (!profile.cantina) profile.cantina = customer.first_name || '';

    return NextResponse.json(profile);
  } catch (err) {
    console.error('Vendor profile fetch error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

/** PUT /api/vendor/profile */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !isPositiveInt(String(body.vendorId))) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    const metaData = META_KEYS.map(key => ({
      key: `_vendor_${key}`,
      value: sanitize(body[key] || '', key === 'iban' ? 27 : key === 'indirizzo' || key === 'indirizzoEsperienze' ? 300 : 200),
    }));

    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: sanitize(body.cantina || body.nome || '', 200),
        last_name: sanitize(body.cognome || '', 200),
        meta_data: metaData,
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
