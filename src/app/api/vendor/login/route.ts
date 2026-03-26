import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { sanitize } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.email || !body?.password) {
      return NextResponse.json({ message: 'Email e password obbligatorie' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Authenticate via WP JWT endpoint
    const jwtRes = await fetch(`${wc.baseUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: sanitize(body.email, 254), password: sanitize(body.password, 128) }),
    });

    const jwtData = await jwtRes.json();
    if (!jwtRes.ok || !jwtData.token) {
      return NextResponse.json({ message: 'Credenziali non valide' }, { status: 401 });
    }

    // Fetch customer to check role
    const searchRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers?${auth}&email=${encodeURIComponent(body.email)}`);
    const customers = await searchRes.json();

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ message: 'Account non trovato' }, { status: 404 });
    }

    const customer = customers[0];
    const role = customer.role || 'customer';
    const isVendor = role === 'vendor' || role === 'wcfm_vendor' || role === 'dc_vendor';

    const meta = (customer.meta_data || []) as { key: string; value: string }[];
    const get = (k: string) => meta.find(m => m.key === k)?.value || '';

    return NextResponse.json({
      success: true,
      token: jwtData.token,
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        username: customer.username,
      },
      role,
      isVendor,
      vendor: isVendor ? {
        cantina: get('_vendor_cantina') || customer.first_name,
        regione: get('_vendor_regione'),
        piva: get('_vendor_piva'),
      } : null,
    });
  } catch (err) {
    console.error('Vendor login error:', err);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
