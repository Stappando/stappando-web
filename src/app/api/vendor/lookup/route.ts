import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** GET /api/vendor/lookup?email=xxx — find WC customer by email, return id + role + meta_data */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
  }

  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    const res = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&role=all&${auth}`,
    );
    if (!res.ok) return NextResponse.json({ error: 'Errore WC' }, { status: 502 });

    const customers = await res.json();
    if (!customers[0]) {
      return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
    }

    const c = customers[0];
    return NextResponse.json({
      id: c.id,
      email: c.email,
      role: c.role,
      first_name: c.first_name,
      meta_data: c.meta_data,
    });
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
