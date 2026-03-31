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

    // Sync shop data to pa_produttore term meta (so /cantine/slug page shows it)
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
          // Update term description
          const attrRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/attributes?${auth}`);
          if (attrRes.ok) {
            const attrs: { id: number; slug: string }[] = await attrRes.json();
            const prodAttr = attrs.find(a => a.slug === 'pa_produttore');
            if (prodAttr) {
              // Update term description via WC API
              await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/attributes/${prodAttr.id}/terms/${termId}?${auth}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: shopData.descrizione }),
              });
            }
          }

          // Update term meta (region, address, banner) via WP snippet endpoint
          // The producer-logos snippet reads these metas
          const wpUser = process.env.WP_USER;
          const wpPass = process.env.WP_APP_PASSWORD;
          if (wpUser && wpPass) {
            const wpAuth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
            // Update term meta via custom endpoint
            await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/update-producer-meta`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Basic ${wpAuth}` },
              body: JSON.stringify({
                term_id: parseInt(termId),
                region: shopData.regione,
                address: shopData.indirizzo,
                banner: shopData.banner,
                logo: shopData.logo,
              }),
            }).catch(e => console.error('Failed to update producer meta:', e));
          }

          // Clear transient cache
          console.log(`[Shop] Synced vendor ${body.vendorId} shop to producer term ${termId}`);
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
