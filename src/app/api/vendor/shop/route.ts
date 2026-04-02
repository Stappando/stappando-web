import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * Vendor shop storage: uses WC shipping fields (same workaround as profile).
 * - shipping.company → JSON { logo, banner, descrizione }
 * WC always saves shipping fields correctly.
 */

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

    // Parse shop data from shipping.company
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

    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipping: {
          company: JSON.stringify(shopData),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('WC shop update failed:', res.status, err);
      return NextResponse.json({ error: `Errore WC (${res.status})`, details: err }, { status: res.status });
    }

    // Sync shop data to pa_produttore term (logo via WC API + meta via custom endpoint)
    try {
      // Get _producer_term_id from customer billing.address_2
      const custRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`);
      if (custRes.ok) {
        const cust = await custRes.json();
        const addr2 = cust.billing?.address_2 || '{}';
        let extra: Record<string, string> = {};
        try { extra = JSON.parse(addr2); } catch { /* */ }
        const termId = extra._producer_term_id;

        if (termId) {
          // Find pa_produttore attribute ID
          const attrRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/attributes?${auth}`);
          let attrId: number | null = null;
          if (attrRes.ok) {
            const attrs: { id: number; slug: string }[] = await attrRes.json();
            attrId = attrs.find(a => a.slug === 'pa_produttore')?.id ?? null;
          }

          if (attrId) {
            // Build term update payload — always update description
            // Also update native WC term image with logo URL so cantina page can
            // display it without depending on the custom endpoint
            const termPayload: Record<string, unknown> = { description: shopData.descrizione };
            if (shopData.logo) {
              termPayload.image = { src: shopData.logo };
            }
            const termPutRes = await fetch(
              `${wc.baseUrl}/wp-json/wc/v3/products/attributes/${attrId}/terms/${termId}?${auth}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(termPayload),
              },
            );
            if (!termPutRes.ok) {
              const termErr = await termPutRes.text().catch(() => '');
              console.error(`[Shop] Failed to update term ${termId} (${termPutRes.status}):`, termErr);
            } else {
              console.log(`[Shop] Updated WC term ${termId} (logo + description) for vendor ${body.vendorId}`);
            }
          }

          // Also call custom endpoint to sync region, address, banner (and logo as backup)
          const wpUser = process.env.WP_USER;
          const wpPass = process.env.WP_APP_PASSWORD;
          if (wpUser && wpPass) {
            const wpAuth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
            const metaRes = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/update-producer-meta`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Basic ${wpAuth}` },
              body: JSON.stringify({
                term_id: parseInt(termId),
                region: shopData.regione,
                address: shopData.indirizzo,
                banner: shopData.banner,
                logo: shopData.logo,
              }),
            });
            if (!metaRes.ok) {
              const metaErr = await metaRes.text().catch(() => '');
              console.error(`[Shop] update-producer-meta failed (${metaRes.status}):`, metaErr);
            } else {
              console.log(`[Shop] Synced meta for vendor ${body.vendorId}, term ${termId}`);
            }
          } else {
            console.warn('[Shop] WP_USER / WP_APP_PASSWORD not set — banner/region/address meta not synced');
          }
        } else {
          console.warn(`[Shop] No _producer_term_id found for vendor ${body.vendorId} — run profile save first`);
        }
      }
    } catch (e) {
      console.error('Failed to sync shop to producer:', e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vendor shop update error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
