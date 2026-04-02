/**
 * Admin endpoint to edit vendor shop data (logo, banner, descrizione, regione, indirizzo)
 * on behalf of a vendor. Uses the same sync logic as the vendor shop PUT route.
 * Requires ADMIN_PASSWORD env var.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt, sanitize } from '@/lib/validation';
import { syncShopToProducerTerm } from '@/lib/vendor/sync-producer-term';

export const dynamic = 'force-dynamic';

/** PUT /api/admin/vendor/shop */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Body non valido' }, { status: 400 });

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

    // 2. Sync to pa_produttore term (same as vendor self-edit)
    await syncShopToProducerTerm({ vendorId: body.vendorId, shopData });

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

    const meta: { key: string; value: string }[] = customer.meta_data || [];
    const cantinaName = meta.find(m => m.key === '_vendor_cantina')?.value || customer.first_name || '';

    // Also check billing.address_2 for _producer_term_id
    let termId: string | null = null;
    try {
      const addr2 = customer.billing?.address_2 || '';
      if (addr2.startsWith('{')) {
        termId = (JSON.parse(addr2) as Record<string, string>)._producer_term_id || null;
      }
    } catch { /* */ }

    return NextResponse.json({
      vendorId: customer.id,
      cantinaName,
      email: customer.email || '',
      ...shop,
      termId,
    });
  } catch (err) {
    console.error('[Admin/vendor/shop] GET error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
