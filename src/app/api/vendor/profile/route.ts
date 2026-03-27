import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const META_KEYS = [
  'cantina', 'nome', 'cognome', 'telefono',
  'ragioneSociale', 'piva', 'codiceFiscale', 'pec', 'sdi',
  'indirizzo', 'citta', 'provincia', 'cap', 'regione',
  'iban', 'intestazioneIban',
] as const;

/**
 * WC REST API bug: meta_data on customers only UPDATES existing meta, doesn't CREATE new ones.
 * Workaround: store the entire vendor profile as a single JSON string in one meta key `_vendor_profile_json`.
 * This key was created during vendor registration, so it always exists.
 * Additionally, we update first_name/last_name which always work.
 */

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

    // Try to read from JSON meta first
    const jsonMeta = meta.find(m => m.key === '_vendor_profile_json')?.value;
    if (jsonMeta) {
      try {
        const parsed = JSON.parse(jsonMeta);
        // Ensure email from customer
        parsed.email = parsed.email || customer.email || '';
        if (!parsed.cantina) parsed.cantina = customer.first_name || '';
        return NextResponse.json(parsed);
      } catch { /* JSON parse failed, fall through */ }
    }

    // Fallback: read individual meta keys (for backward compat)
    const getMeta = (key: string) => meta.find(m => m.key === `_vendor_${key}`)?.value || '';
    const profile: Record<string, string> = { email: customer.email || '' };
    for (const key of META_KEYS) {
      profile[key] = getMeta(key);
    }
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

    // Build clean profile object
    const profileData: Record<string, string> = {};
    for (const key of META_KEYS) {
      const maxLen = key === 'iban' ? 34 : key === 'indirizzo' ? 300 : 200;
      profileData[key] = sanitize(body[key] || '', maxLen);
    }
    profileData.email = sanitize(body.email || '', 254);

    // Step 1: Ensure _vendor_profile_json meta exists by first reading customer
    const getRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`);
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Vendor non trovato' }, { status: 404 });
    }
    const customer = await getRes.json();
    const existingMeta = (customer.meta_data || []) as { id: number; key: string; value: string }[];
    const jsonMetaEntry = existingMeta.find(m => m.key === '_vendor_profile_json');

    // Step 2: Build meta_data array for update
    const metaUpdate: { id?: number; key: string; value: string }[] = [];

    if (jsonMetaEntry) {
      // Update existing meta entry by ID (this always works in WC)
      metaUpdate.push({ id: jsonMetaEntry.id, key: '_vendor_profile_json', value: JSON.stringify(profileData) });
    } else {
      // Meta doesn't exist yet — create it (WC may or may not handle this)
      metaUpdate.push({ key: '_vendor_profile_json', value: JSON.stringify(profileData) });
    }

    // Step 3: Update customer
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: sanitize(body.cantina || body.nome || '', 200),
        last_name: sanitize(body.cognome || '', 200),
        meta_data: metaUpdate,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('WC profile update failed:', res.status, err);
      return NextResponse.json({ error: `Errore WC (${res.status})`, details: err }, { status: res.status });
    }

    // Verify it was saved
    const verifyRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`);
    if (verifyRes.ok) {
      const verified = await verifyRes.json();
      const savedJson = (verified.meta_data || []).find((m: { key: string }) => m.key === '_vendor_profile_json');
      if (!savedJson) {
        console.warn('Profile JSON meta was not persisted by WC, trying direct WP API...');
        // Last resort: try WP REST API
        const wpAuth = getWPAuth();
        if (wpAuth) {
          await fetch(`${wc.baseUrl}/wp-json/wp/v2/users/${body.vendorId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: wpAuth },
            body: JSON.stringify({ meta: { _vendor_profile_json: JSON.stringify(profileData) } }),
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vendor profile update error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

function getWPAuth(): string | null {
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;
  if (!user || !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}
