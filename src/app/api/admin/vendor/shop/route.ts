/**
 * Admin endpoint to edit vendor shop data (logo, banner, descrizione, regione, indirizzo)
 * on behalf of a vendor. Uses the same sync logic as the vendor shop PUT route.
 * Requires ADMIN_PASSWORD env var.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** PUT /api/admin/vendor/shop */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Body non valido' }, { status: 400 });

    // Admin auth
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || body.adminPassword !== adminPassword) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!isPositiveInt(String(body.vendorId))) {
      return NextResponse.json({ error: 'vendorId obbligatorio' }, { status: 400 });
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

    // 1. Save to WC customer shipping.company
    const saveRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping: { company: JSON.stringify(shopData) } }),
    });
    if (!saveRes.ok) {
      const err = await saveRes.json().catch(() => ({}));
      console.error('[Admin/vendor/shop] WC customer update failed:', saveRes.status, err);
      return NextResponse.json({ error: `Errore WC (${saveRes.status})` }, { status: saveRes.status });
    }

    // 2. Sync to pa_produttore term
    try {
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
            // Update WC term (description + native logo image)
            const termPayload: Record<string, unknown> = { description: shopData.descrizione };
            if (shopData.logo) termPayload.image = { src: shopData.logo };
            const termRes = await fetch(
              `${wc.baseUrl}/wp-json/wc/v3/products/attributes/${attrId}/terms/${termId}?${auth}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(termPayload),
              },
            );
            if (!termRes.ok) {
              const termErr = await termRes.text().catch(() => '');
              console.error(`[Admin/vendor/shop] Term update failed (${termRes.status}):`, termErr);
            } else {
              console.log(`[Admin/vendor/shop] Updated term ${termId} for vendor ${body.vendorId}`);
            }
          }

          // Custom endpoint for region/address/banner
          const wpUser = process.env.WP_USER;
          const wpPass = process.env.WP_APP_PASSWORD;
          if (wpUser && wpPass) {
            const wpAuth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
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
            }).catch(e => console.error('[Admin/vendor/shop] update-producer-meta failed:', e));
          }
        } else {
          console.warn(`[Admin/vendor/shop] No _producer_term_id for vendor ${body.vendorId}`);
        }
      }
    } catch (e) {
      console.error('[Admin/vendor/shop] Sync to producer failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin/vendor/shop] Error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

/** GET /api/admin/vendor/shop?vendorId=N&adminPassword=X */
export async function GET(req: NextRequest) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const reqPassword = req.nextUrl.searchParams.get('adminPassword');
    if (!adminPassword || reqPassword !== adminPassword) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const vendorId = req.nextUrl.searchParams.get('vendorId');
    if (!isPositiveInt(vendorId)) {
      return NextResponse.json({ error: 'vendorId obbligatorio' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

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

    // Also check WC term image as logo fallback
    const addr2 = customer.billing?.address_2 || '{}';
    let extra: Record<string, string> = {};
    try { extra = JSON.parse(addr2); } catch { /* */ }
    const termId = extra._producer_term_id;

    if (termId && !shop.logo) {
      const attrRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/products/attributes?${auth}`);
      if (attrRes.ok) {
        const attrs: { id: number; slug: string }[] = await attrRes.json();
        const prodAttr = attrs.find(a => a.slug === 'pa_produttore');
        if (prodAttr) {
          const termRes = await fetch(
            `${wc.baseUrl}/wp-json/wc/v3/products/attributes/${prodAttr.id}/terms/${termId}?${auth}`,
          );
          if (termRes.ok) {
            const term = await termRes.json();
            if (term.image?.src) shop.logo = term.image.src;
          }
        }
      }
    }

    return NextResponse.json({
      vendorId: customer.id,
      cantinaName: customer.first_name || '',
      email: customer.email || '',
      ...shop,
      termId: termId || null,
    });
  } catch (err) {
    console.error('[Admin/vendor/shop] GET error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
