import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';

/** Find or create pa_produttore term, save _producer_term_id on customer */
async function linkVendorToProducer(baseUrl: string, auth: string, vendorId: number, cantinaName: string) {
  // 1. Get all producer attribute terms, search for match
  const attrsRes = await fetch(`${baseUrl}/wp-json/wc/v3/products/attributes?${auth}`);
  if (!attrsRes.ok) return;
  const attrs: { id: number; slug: string }[] = await attrsRes.json();
  const produttoreAttr = attrs.find(a => a.slug === 'pa_produttore');
  if (!produttoreAttr) return;

  // 2. Search for existing term
  const termsRes = await fetch(`${baseUrl}/wp-json/wc/v3/products/attributes/${produttoreAttr.id}/terms?search=${encodeURIComponent(cantinaName)}&per_page=5&${auth}`);
  let termId: number | null = null;
  if (termsRes.ok) {
    const terms: { id: number; name: string }[] = await termsRes.json();
    const match = terms.find(t => t.name.toLowerCase() === cantinaName.toLowerCase());
    if (match) termId = match.id;
  }

  // 3. Create term if not exists
  if (!termId) {
    const createRes = await fetch(`${baseUrl}/wp-json/wc/v3/products/attributes/${produttoreAttr.id}/terms?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cantinaName }),
    });
    if (createRes.ok) {
      const created: { id: number } = await createRes.json();
      termId = created.id;
    }
  }

  // 4. Save _producer_term_id on the customer via meta
  if (termId) {
    // Store in billing address_2 JSON (where we already store extra fields)
    // We'll read it back in the shop API to update the term
    console.log(`[Vendor Profile] Linked vendor ${vendorId} to producer term ${termId} (${cantinaName})`);

    // Update customer meta with term ID — use the existing billing.address_2 JSON
    const custRes = await fetch(`${baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`);
    if (custRes.ok) {
      const cust = await custRes.json();
      const addr2 = cust.billing?.address_2 || '{}';
      let extra: Record<string, string> = {};
      try { extra = JSON.parse(addr2); } catch { /* */ }
      extra._producer_term_id = String(termId);

      await fetch(`${baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing: { address_2: JSON.stringify(extra) } }),
      });
    }
  }
}

export const dynamic = 'force-dynamic';

/**
 * Vendor profile storage strategy:
 *
 * WC REST API bug: meta_data on customers only UPDATES existing meta, won't CREATE new ones.
 *
 * Solution: Store profile data in WC billing fields (which always save correctly):
 * - billing.first_name → nome
 * - billing.last_name → cognome
 * - billing.company → ragioneSociale
 * - billing.phone → telefono
 * - billing.email → email
 * - billing.address_1 → indirizzo
 * - billing.city → citta
 * - billing.state → provincia
 * - billing.postcode → cap
 * - billing.country → 'IT'
 *
 * Plus first_name/last_name at customer level for cantina name.
 *
 * Extra fields stored as a JSON note in billing.address_2:
 * { piva, codiceFiscale, pec, sdi, regione, iban, intestazioneIban }
 */

interface VendorExtra {
  piva: string;
  codiceFiscale: string;
  pec: string;
  sdi: string;
  regione: string;
  iban: string;
  intestazioneIban: string;
}

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

    const c = await res.json();
    const b = c.billing || {};

    // Parse extra fields from billing.address_2
    let extra: VendorExtra = { piva: '', codiceFiscale: '', pec: '', sdi: '', regione: '', iban: '', intestazioneIban: '' };
    try {
      if (b.address_2 && b.address_2.startsWith('{')) {
        extra = { ...extra, ...JSON.parse(b.address_2) };
      }
    } catch { /* not JSON, ignore */ }

    return NextResponse.json({
      cantina: c.first_name || '',
      nome: b.first_name || '',
      cognome: b.last_name || '',
      telefono: b.phone || '',
      email: b.email || c.email || '',
      ragioneSociale: b.company || '',
      indirizzo: b.address_1 || '',
      citta: b.city || '',
      provincia: b.state || '',
      cap: b.postcode || '',
      regione: extra.regione || '',
      piva: extra.piva || '',
      codiceFiscale: extra.codiceFiscale || '',
      pec: extra.pec || '',
      sdi: extra.sdi || '',
      iban: extra.iban || '',
      intestazioneIban: extra.intestazioneIban || '',
    });
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

    // Extra fields stored as JSON in address_2
    const extra: VendorExtra = {
      piva: sanitize(body.piva || '', 20),
      codiceFiscale: sanitize(body.codiceFiscale || '', 16),
      pec: sanitize(body.pec || '', 254),
      sdi: sanitize(body.sdi || '', 7),
      regione: sanitize(body.regione || '', 100),
      iban: sanitize(body.iban || '', 34),
      intestazioneIban: sanitize(body.intestazioneIban || '', 200),
    };

    const updateData = {
      first_name: sanitize(body.cantina || body.nome || '', 200),
      last_name: sanitize(body.cognome || '', 200),
      billing: {
        first_name: sanitize(body.nome || '', 100),
        last_name: sanitize(body.cognome || '', 100),
        company: sanitize(body.ragioneSociale || '', 200),
        phone: sanitize(body.telefono || '', 30),
        email: sanitize(body.email || '', 254),
        address_1: sanitize(body.indirizzo || '', 300),
        address_2: JSON.stringify(extra),
        city: sanitize(body.citta || '', 100),
        state: sanitize(body.provincia || '', 10),
        postcode: sanitize(body.cap || '', 10),
        country: 'IT',
      },
    };

    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('WC profile update failed:', res.status, err);
      return NextResponse.json({ error: `Errore WC (${res.status})`, details: err }, { status: res.status });
    }

    // Link vendor to pa_produttore term (create if not exists)
    const cantinaName = sanitize(body.cantina || '', 200).trim();
    if (cantinaName) {
      try {
        await linkVendorToProducer(wc.baseUrl, auth, body.vendorId, cantinaName);
      } catch (e) {
        console.error('Failed to link vendor to producer term:', e);
        // Don't fail the profile save
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vendor profile update error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
