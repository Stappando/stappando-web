/**
 * Dedicated address storage — avoids WC REST API meta_data creation bug.
 *
 * WooCommerce REST API bug: PUT with meta_data only UPDATES existing meta keys,
 * it does NOT create new ones. So _saved_addresses never persists on first save.
 *
 * Solution: store addresses as JSON in shipping.address_2, which WC always saves
 * reliably (it's a native WC field). We use a JSON marker prefix to distinguish
 * from a real address line.
 *
 * Format in shipping.address_2: "||addr||[{"id":"...","address_1":"..."}]"
 *
 * Also syncs WC shipping fields with the default address for compatibility.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

const MARKER = '||addr||';

interface SavedAddress {
  id: string;
  label?: string;
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  phone?: string;
  isDefault?: boolean;
}

function parseAddresses(raw: string): SavedAddress[] {
  if (!raw) return [];
  // Try our marker format first
  if (raw.startsWith(MARKER)) {
    try { return JSON.parse(raw.slice(MARKER.length)); } catch { /* */ }
  }
  // Try plain JSON (legacy)
  if (raw.startsWith('[')) {
    try { return JSON.parse(raw); } catch { /* */ }
  }
  return [];
}

/** GET /api/customers/addresses?customerId=N */
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get('customerId');
  if (!isPositiveInt(customerId)) {
    return NextResponse.json({ error: 'customerId richiesto' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${customerId}?${auth}`);
    if (!res.ok) return NextResponse.json({ addresses: [] });
    const customer = await res.json();

    // 1. Try shipping.address_2 (our reliable storage)
    const addr2 = customer.shipping?.address_2 || '';
    if (addr2.startsWith(MARKER) || addr2.startsWith('[')) {
      const addresses = parseAddresses(addr2);
      if (addresses.length > 0) return NextResponse.json({ addresses });
    }

    // 2. Try meta_data._saved_addresses (legacy / may work on some WC versions)
    const meta: { key: string; value: string }[] = customer.meta_data || [];
    const metaRaw = meta.find(m => m.key === '_saved_addresses')?.value || '';
    if (metaRaw) {
      const addresses = parseAddresses(metaRaw);
      if (addresses.length > 0) return NextResponse.json({ addresses });
    }

    // 3. Migrate from single shipping address
    const s = customer.shipping || {};
    if (s.address_1) {
      const migrated: SavedAddress[] = [{
        id: '1',
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        address_1: s.address_1 || '',
        city: s.city || '',
        state: s.state || '',
        postcode: s.postcode || '',
        phone: '',
        isDefault: true,
      }];
      return NextResponse.json({ addresses: migrated });
    }

    return NextResponse.json({ addresses: [] });
  } catch (err) {
    console.error('GET /api/customers/addresses error:', err);
    return NextResponse.json({ addresses: [] });
  }
}

/** PUT /api/customers/addresses — save address list */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !isPositiveInt(String(body.customerId))) {
      return NextResponse.json({ error: 'customerId richiesto' }, { status: 400 });
    }

    const addresses: SavedAddress[] = body.addresses || [];
    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Build WC shipping fields from default address (for WC order compatibility)
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || null;
    const shippingFields = defaultAddr ? {
      first_name: defaultAddr.first_name || '',
      last_name: defaultAddr.last_name || '',
      address_1: defaultAddr.address_1 || '',
      address_2: MARKER + JSON.stringify(addresses), // our storage
      city: defaultAddr.city || '',
      state: defaultAddr.state || '',
      postcode: defaultAddr.postcode || '',
      country: 'IT',
    } : {
      address_2: MARKER + JSON.stringify(addresses),
    };

    // Also try meta_data (works on WC versions that support meta creation)
    const payload = {
      shipping: shippingFields,
      meta_data: [{ key: '_saved_addresses', value: JSON.stringify(addresses) }],
    };

    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.customerId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('PUT /api/customers/addresses WC error:', res.status, err);
      return NextResponse.json({ error: `WC error ${res.status}` }, { status: res.status });
    }

    console.log(`Saved ${addresses.length} addresses for customer ${body.customerId}`);
    return NextResponse.json({ success: true, count: addresses.length });
  } catch (err) {
    console.error('PUT /api/customers/addresses error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
