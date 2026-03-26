import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isNonEmptyString, sanitize } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ message: 'Body JSON non valido' }, { status: 400 });
    }

    const username = sanitize(body.username, 254);
    const password = sanitize(body.password, 128);

    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return NextResponse.json({ message: 'Username e password obbligatori' }, { status: 400 });
    }

    const wc = getWCSecrets();

    // 1. Get JWT token
    const tokenRes = await fetch(`${wc.baseUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json(
        { message: tokenData.message || 'Credenziali non valide' },
        { status: 401 },
      );
    }

    const email = tokenData.data?.email || tokenData.user_email || username;
    const userId = tokenData.data?.id || tokenData.user_id || 0;
    const nicename = tokenData.data?.nicename || tokenData.user_nicename || username;
    const token = tokenData.data?.token || tokenData.token;
    const firstName = tokenData.data?.firstName || '';
    const lastName = tokenData.data?.lastName || '';

    // 2. Fetch customer data from WooCommerce
    let custFirstName = firstName;
    let custLastName = lastName;
    let custId = userId;
    let custRole = 'customer';
    try {
      const custUrl = `${wc.baseUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
      const custRes = await fetch(custUrl);
      if (custRes.ok) {
        const customers = await custRes.json();
        if (customers[0]) {
          custFirstName = customers[0].first_name || custFirstName;
          custLastName = customers[0].last_name || custLastName;
          custId = customers[0].id || custId;
          custRole = customers[0].role || 'customer';
        }
      }
    } catch { /* use JWT data */ }

    return NextResponse.json({
      user: {
        id: custId,
        email,
        firstName: custFirstName,
        lastName: custLastName,
        username: nicename,
      },
      token,
      role: custRole,
    });
  } catch {
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
